import { Coingecko } from "../api/coingecko";
import { DEFAULT_TOKEN_ADDRESSES, COINGECKO_IDS } from "../constants";
import { Blockchain } from "../types";
import { handleError, getPriceAtDate, roundUSD } from "../utils";

export class CurrencyConverter {
  private static BASE_TOKENS = Object.values(Blockchain).map((chain) => ({
    address: DEFAULT_TOKEN_ADDRESSES[chain].toString(),
    fetch: () =>
      Coingecko.getHistoricalPricesById(COINGECKO_IDS[chain].geckoId, "usd"),
  }));

  private static BASE_TOKENS_ADDRESSES = CurrencyConverter.BASE_TOKENS.map(
    (token) => token.address.toString()
  );

  private static tokenAddressPrices: Record<string, number[][]> = {};

  public static async getHistoricalPricesByChainAndAddress(
    chain: Blockchain,
    address: string
  ): Promise<number[][]> {
    return await Coingecko.getHistoricalPricesByAddress(
      COINGECKO_IDS[chain].platform,
      address,
      COINGECKO_IDS[chain].symbol
    );
  }

  public static async fetchTokenAddressPrices(
    sales: any
  ): Promise<Record<string, number[][]>> {
    const tokenAddressPrices: Record<string, number[][]> = {};
    const tokenAddresses = sales.reduce((tokenAddresses: any[], sale: any) => {
      const flattenedTokenAddresses = tokenAddresses.map(
        (address) => address.address
      );
      const unique = !flattenedTokenAddresses.includes(
        sale.paymentTokenAddress
      );
      const notBaseToken = !CurrencyConverter.BASE_TOKENS_ADDRESSES.includes(
        sale.paymentTokenAddress
      );
      if (unique && notBaseToken) {
        tokenAddresses.push({
          address: sale.paymentTokenAddress,
          chain: sale.chain,
        });
        return tokenAddresses;
      }
      return tokenAddresses;
    }, []);

    for (const baseToken of CurrencyConverter.BASE_TOKENS) {
      if (!(baseToken.address in CurrencyConverter.tokenAddressPrices)) {
        tokenAddressPrices[baseToken.address.toString()] =
          await baseToken.fetch();
      }
    }

    for (const tokenAddress of tokenAddresses) {
      try {
        if (!(tokenAddress.address in CurrencyConverter.tokenAddressPrices)) {
          tokenAddressPrices[tokenAddress.address.toString()] =
            await CurrencyConverter.getHistoricalPricesByChainAndAddress(
              tokenAddress.chain as any,
              tokenAddress.address
            );
        }
      } catch (e) {
        await handleError(
          e,
          "currency-converter-adapter:fetchTokenAddressPrices"
        );
      }
    }

    CurrencyConverter.tokenAddressPrices = {
      ...CurrencyConverter.tokenAddressPrices,
      ...tokenAddressPrices,
    };

    return CurrencyConverter.tokenAddressPrices;
  }

  public static async convertSales(sales: any) {
    console.log("Running currency conversions for", sales.length, "sales");
    const tokenAddressPrices = await CurrencyConverter.fetchTokenAddressPrices(
      sales
    );

    for (const sale of sales) {
      const tokenAddress = sale.paymentTokenAddress.toString();
      const timestamp = parseInt(sale.timestamp);
      const price = sale.price;
      const chain = sale.chain as Blockchain;

      // If the token's historical prices was not found
      if (!(tokenAddress in tokenAddressPrices)) {
        sale.priceBase = -1;
        sale.priceUSD = -1;
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
        sale.priceUSD = -1;
        continue;
      }

      // If the token is a base token
      if (CurrencyConverter.BASE_TOKENS_ADDRESSES.includes(tokenAddress)) {
        sale.priceBase = price;
        sale.priceUSD = roundUSD(price * priceAtDate);
        continue;
      }

      const baseAddress = DEFAULT_TOKEN_ADDRESSES[chain];
      sale.priceBase = price * priceAtDate;
      sale.priceUSD = roundUSD(
        price *
          priceAtDate *
          getPriceAtDate(timestamp, tokenAddressPrices[baseAddress])
      );
    }

    return sales;
  }
}
