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
  }

  return tokenAddressPrices;
}

export async function getHistoricalPricesByChainAndAddress(
  chain: Blockchain,
  address: string
): Promise<number[][]> {
  return Coingecko.getHistoricalPricesByAddress(
    COINGECKO_IDS[chain].platform,
    address,
    COINGECKO_IDS[chain].symbol
  );
}

export async function updateSaleCurrencyConversions(
  sales: Sale[],
  tokenAddressPrices: Record<string, number[][]>
): Promise<void> {
  console.log("Updating currency conversions for", sales.length, "sales");

  for (const sale of sales) {
    const tokenAddress = sale.paymentTokenAddress;
    const timestamp = sale.timestamp.toString();
    const price = sale.price;
    const chain = sale.collection.chain as Blockchain;

    // If the token's historical prices was not found
    if (!(tokenAddress in tokenAddressPrices)) {
      sale.priceBase = -1;
      sale.priceUSD = BigInt(-1);
      continue;
    }

    // USD price for base tokens, base price for all other tokens
    const priceAtDate = getPriceAtDate(
      timestamp,
      tokenAddressPrices[tokenAddress]
    );

    // If the token's historical prices was found but not at the sale date
    if (!priceAtDate) {
      sale.priceBase = -1;
      sale.priceUSD = BigInt(-1);
      continue;
    }

    // If the token is a base token
    if (BASE_TOKENS_ADDRESSES.includes(tokenAddress)) {
      sale.priceBase = price;
      sale.priceUSD = formatUSD(price * priceAtDate);
      continue;
    }

    const baseAddress = DEFAULT_TOKEN_ADDRESSES[chain];
    sale.priceBase = price * priceAtDate;
    sale.priceUSD = formatUSD(
      price *
        priceAtDate *
        getPriceAtDate(timestamp, tokenAddressPrices[baseAddress])
    );
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
