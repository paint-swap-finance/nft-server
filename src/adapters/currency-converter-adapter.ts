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

//TODO optimize
async function updateSaleCurrencyConversions(): Promise<void> {
  const sales = await Sale.getUnconverted();

  const tokenAddresses = sales.reduce((addresses, sale) => {
    const tokenAddress = sale.paymentTokenAddress;
    const notBaseToken = !DEFAULT_TOKENS.includes(tokenAddress);
    const isUnique = !addresses.includes(tokenAddress);
    if (notBaseToken && isUnique) {
      addresses.push(tokenAddress);
    }
    return addresses;
  }, []);

  let tokenAddressPrices: Record<string, number[][]> = {};

  // TODO do not hardcode
  tokenAddressPrices[ETHEREUM_DEFAULT_TOKEN_ADDRESS] =
    await Coingecko.getHistoricalEthPrices();
  tokenAddressPrices[SOLANA_DEFAULT_TOKEN_ADDRESS] =
    await Coingecko.getHistoricalSolPrices();

  for (const tokenAddress of tokenAddresses) {
    try {
      //TODO generalize for other chains
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

  console.log("Updating currency conversions for", sales.length, "sales");

  let count = 0;
  for (const sale of sales) {
    // TODO generalize for other chains
    console.log(sale.paymentTokenAddress, "is found in price data:", sale.paymentTokenAddress in tokenAddressPrices)

    if (
      sale.paymentTokenAddress in tokenAddressPrices &&
      sale.paymentTokenAddress != ETHEREUM_DEFAULT_TOKEN_ADDRESS &&
      sale.paymentTokenAddress != SOLANA_DEFAULT_TOKEN_ADDRESS
    ) {
      count++;
      const timestamp = sale.timestamp.toString();
      const priceBase = getPriceAtDate(
        timestamp,
        tokenAddressPrices[sale.paymentTokenAddress]
      );
      const priceUSD = formatUSD(
        priceBase *
          getPriceAtDate(
            timestamp,
            tokenAddressPrices[ETHEREUM_DEFAULT_TOKEN_ADDRESS]
          )
      );

      sale.priceBase = priceBase ?? -1;
      sale.priceUSD = priceUSD ?? BigInt(-1);
      console.log(
        sale.txnHash,
        "successfully updated. no",
        count,
        "of",
        sales.length
      );
    } else if (sale.paymentTokenAddress == ETHEREUM_DEFAULT_TOKEN_ADDRESS) {
      count++;
      sale.priceBase = sale.price;
      sale.priceUSD = formatUSD(
        sale.price *
          getPriceAtDate(
            sale.timestamp.toString(),
            tokenAddressPrices[ETHEREUM_DEFAULT_TOKEN_ADDRESS]
          )
      );
      console.log(
        sale.txnHash,
        "successfully updated. no",
        count,
        "of",
        sales.length
      );
    } else if (sale.paymentTokenAddress == SOLANA_DEFAULT_TOKEN_ADDRESS) {
      count++;
      sale.priceBase = sale.price;
      sale.priceUSD = formatUSD(
        sale.price *
          getPriceAtDate(
            sale.timestamp.toString(),
            tokenAddressPrices[SOLANA_DEFAULT_TOKEN_ADDRESS]
          )
      );
      console.log(
        sale.txnHash,
        "successfully updated. no",
        count,
        "of",
        sales.length
      );
    } else {
      //TODO handle for token addresses whose prices cant be found
      console.log("price data not found for txn hash", sale.txnHash);
      sale.priceBase = -1;
      sale.priceUSD = BigInt(-1);
    }
  }

  Sale.save(sales, { chunk: 100 });
  console.log("saving updated values for", sales.length, "sales");
}

const CurrencyConverterAdapter: DataAdapter = { run };
export default CurrencyConverterAdapter;
