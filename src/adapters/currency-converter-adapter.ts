import axios from "axios";
import { Sale } from "../models/sale";
import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { getPriceAtDate, sleep, formatUSD, handleError } from "../utils";
import { COINGECKO_IDS, DEFAULT_TOKEN_ADDRESSES } from "../constants";
import { Blockchain } from "../types";

const BASE_TOKENS = [
  {
    address: DEFAULT_TOKEN_ADDRESSES[Blockchain.Ethereum],
    fetch: () =>
      Coingecko.getHistoricalPricesById(
        COINGECKO_IDS[Blockchain.Ethereum].geckoId,
        "usd"
      ),
  },
  {
    address: DEFAULT_TOKEN_ADDRESSES[Blockchain.Solana],
    fetch: () =>
      Coingecko.getHistoricalPricesById(
        COINGECKO_IDS[Blockchain.Solana].geckoId,
        "usd"
      ),
  },
  {
    address: DEFAULT_TOKEN_ADDRESSES[Blockchain.Binance],
    fetch: () =>
      Coingecko.getHistoricalPricesById(
        COINGECKO_IDS[Blockchain.Binance].geckoId,
        "usd"
      ),
  },
];

const BASE_TOKENS_ADDRESSES = BASE_TOKENS.map((token) => token.address);

async function runSaleCurrencyConversions(): Promise<void> {
  const sales = await Sale.getUnconvertedSales();
  const tokenAddressPrices = await fetchTokenAddressPrices();

  await updateSaleCurrencyConversions(sales, tokenAddressPrices);
}

// TODO optimize and refactor
export async function fetchTokenAddressPrices(): Promise<
  Record<string, number[][]>
> {
  const tokenAddressPrices: Record<string, number[][]> = {};

  const tokenAddressesRaw = await Sale.getPaymentTokenAddresses(false);
  const tokenAddresses = tokenAddressesRaw.filter(
    (data) => !BASE_TOKENS_ADDRESSES.includes(data.address)
  );

  for (const baseToken of BASE_TOKENS) {
    tokenAddressPrices[baseToken.address] = await baseToken.fetch();
  }

  for (const tokenAddress of tokenAddresses) {
    try {
      const prices = await getHistoricalPricesByChainAndAddress(
        tokenAddress.chain as any,
        tokenAddress.address
      );
      tokenAddressPrices[tokenAddress.address] = prices;
    } catch (e) {
      await handleError(
        e,
        "currency-converter-adapter:fetchTokenAddressPrices"
      );
    }
    await sleep(1);
  }

  return tokenAddressPrices;
}

export async function getHistoricalPricesByChainAndAddress(
  chain: Blockchain,
  address: string
): Promise<number[][]> {
  return Coingecko.getHistoricalPricesByAddress(
    COINGECKO_IDS[chain].geckoId,
    address,
    COINGECKO_IDS[chain].symbol
  );
}

//TODO optimize and refactor
export async function updateSaleCurrencyConversions(
  sales: Sale[],
  tokenAddressPrices: Record<string, number[][]>
): Promise<void> {
  console.log("Updating currency conversions for", sales.length, "sales");

  for (const sale of sales) {
    const saleTokenAddress = sale.paymentTokenAddress;
    const saleTimestamp = sale.timestamp.toString();
    const salePrice = sale.price;

    if (
      saleTokenAddress in tokenAddressPrices &&
      !BASE_TOKENS_ADDRESSES.includes(saleTokenAddress)
    ) {
      const baseAtDate = getPriceAtDate(
        saleTimestamp,
        tokenAddressPrices[saleTokenAddress]
      );
      const priceBase = baseAtDate ? salePrice * baseAtDate : null;
      const saleChain = sale.collection.chain as Blockchain;
      const baseAddress = DEFAULT_TOKEN_ADDRESSES[saleChain];

      const priceUSD = priceBase
        ? formatUSD(
            priceBase *
              getPriceAtDate(saleTimestamp, tokenAddressPrices[baseAddress])
          )
        : null;

      sale.priceBase = priceBase ?? -1;
      sale.priceUSD = priceUSD ?? BigInt(-1);
    } else if (BASE_TOKENS_ADDRESSES.includes(saleTokenAddress)) {
      sale.priceBase = salePrice;
      sale.priceUSD = formatUSD(
        salePrice *
          getPriceAtDate(saleTimestamp, tokenAddressPrices[saleTokenAddress])
      );
    } else {
      sale.priceBase = -1;
      sale.priceUSD = BigInt(-1);
    }
  }

  // Break in chunks of 1000 so Postgres doesn't break and Typeorm doesn't freeze
  while (sales.length) {
    console.log("Sales left to update:", sales.length);
    await Sale.save(sales.splice(0, 1000), { chunk: 1000 });
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      console.log("Running currency converter");
      await runSaleCurrencyConversions();
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "currency-converter-adapter");
  }
}

const CurrencyConverterAdapter: DataAdapter = { run };
export default CurrencyConverterAdapter;
