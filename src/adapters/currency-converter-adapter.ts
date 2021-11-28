import axios from "axios";
import { Sale } from "../models/sale";
import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { getPriceAtDate, sleep, formatUSD } from "../utils";
import {
  ETHEREUM_DEFAULT_TOKEN_ADDRESS,
  SOLANA_DEFAULT_TOKEN_ADDRESS,
} from "../constants";

const DEFAULT_TOKENS = [
  ETHEREUM_DEFAULT_TOKEN_ADDRESS,
  SOLANA_DEFAULT_TOKEN_ADDRESS,
];

async function run(): Promise<void> {
  while (true) {
    console.log("Running currency converter");
    await updateSaleCurrencyConversions();
    await sleep(60 * 60);
  }
}

//TODO optimize and refactor
async function updateSaleCurrencyConversions(): Promise<void> {
  const sales = await Sale.getUnconverted();
  const tokenAddressPrices = await fetchTokenAddressPrices(sales);

  console.log("Updating currency conversions for", sales.length, "sales");

  for (const sale of sales) {
    //TODO generalize for other chains
    if (
      sale.paymentTokenAddress in tokenAddressPrices &&
      sale.paymentTokenAddress != ETHEREUM_DEFAULT_TOKEN_ADDRESS &&
      sale.paymentTokenAddress != SOLANA_DEFAULT_TOKEN_ADDRESS
    ) {
      const timestamp = sale.timestamp.toString();
      const baseAtDate = getPriceAtDate(
        timestamp,
        tokenAddressPrices[sale.paymentTokenAddress]
      );
      const priceBase = baseAtDate ? sale.price * baseAtDate : null;
      const priceUSD = priceBase
        ? formatUSD(
            priceBase *
              getPriceAtDate(
                timestamp,
                tokenAddressPrices[ETHEREUM_DEFAULT_TOKEN_ADDRESS]
              )
          )
        : null;

      sale.priceBase = priceBase ?? -1;
      sale.priceUSD = priceUSD ?? BigInt(-1);
    } else if (sale.paymentTokenAddress == ETHEREUM_DEFAULT_TOKEN_ADDRESS) {
      sale.priceBase = sale.price;
      sale.priceUSD = formatUSD(
        sale.price *
          getPriceAtDate(
            sale.timestamp.toString(),
            tokenAddressPrices[ETHEREUM_DEFAULT_TOKEN_ADDRESS]
          )
      );
    } else if (sale.paymentTokenAddress == SOLANA_DEFAULT_TOKEN_ADDRESS) {
      sale.priceBase = sale.price;
      sale.priceUSD = formatUSD(
        sale.price *
          getPriceAtDate(
            sale.timestamp.toString(),
            tokenAddressPrices[SOLANA_DEFAULT_TOKEN_ADDRESS]
          )
      );
    } else {
      sale.priceBase = -1;
      sale.priceUSD = BigInt(-1);
    }
  }

  Sale.save(sales, { chunk: 100 });
}

async function fetchTokenAddressPrices(
  sales: Sale[]
): Promise<Record<string, number[][]>> {
  let tokenAddressPrices: Record<string, number[][]> = {};

  const tokenAddresses = sales.reduce((addresses, sale) => {
    const tokenAddress = sale.paymentTokenAddress;
    const notBaseToken = !DEFAULT_TOKENS.includes(tokenAddress);
    const isUnique = !addresses.includes(tokenAddress);
    if (notBaseToken && isUnique) {
      addresses.push(tokenAddress);
    }
    return addresses;
  }, []);

  // TODO do not hardcode
  tokenAddressPrices[ETHEREUM_DEFAULT_TOKEN_ADDRESS] =
    await Coingecko.getHistoricalEthPrices();
  tokenAddressPrices[SOLANA_DEFAULT_TOKEN_ADDRESS] =
    await Coingecko.getHistoricalSolPrices();

  for (const tokenAddress of tokenAddresses) {
    try {
      //TODO generalize for other chains with multiple payment tokens
      const prices = await Coingecko.getHistoricalPricesByAddress(
        "ethereum",
        tokenAddress,
        "eth"
      );
      tokenAddressPrices[tokenAddress] = prices;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404) {
          console.error("Historical prices not found:", e.message);
        }
        if (e.response.status === 429) {
          // Backoff for 1 minute if rate limited
          await sleep(60);
        }
      }
      console.error("Error retrieving historical prices:", e.message);
    }
    await sleep(1);
  }

  return tokenAddressPrices;
}

const CurrencyConverterAdapter: DataAdapter = { run };
export default CurrencyConverterAdapter;
