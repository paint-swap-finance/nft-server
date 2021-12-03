import axios from "axios";

export class Coingecko {
  private static PRICE_ENDPOINT = "https://api.coingecko.com/api/v3/coins";
  private static HISTORICAL_PRICE_PARAMS = (base: string) =>
    `market_chart?vs_currency=${base}&days=max&interval=daily`;

  public static async getPricesById(coingeckoId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${Coingecko.PRICE_ENDPOINT}/${coingeckoId}`
      );
      return response.data.market_data.current_price;
    } catch (e) {
      console.error("Coingecko API error:", e.message);
      return {};
    }
  }

  public static async getHistoricalPricesById(
    coingeckoId: string,
    base: string
  ): Promise<number[][]> {
    try {
      const response = await axios.get(
        `${
          Coingecko.PRICE_ENDPOINT
        }/${coingeckoId}/${Coingecko.HISTORICAL_PRICE_PARAMS(base)}`
      );
      const { prices } = response.data;
      return prices;
    } catch (e) {
      console.error("Coingecko API error:", e.message);
      return [];
    }
  }

  public static async getHistoricalPricesByAddress(
    platform: string,
    address: string,
    base: string
  ): Promise<number[][]> {
    try {
      const response = await axios.get(
        `${
          Coingecko.PRICE_ENDPOINT
        }/${platform}/contract/${address}/${Coingecko.HISTORICAL_PRICE_PARAMS(
          base
        )}`
      );
      const { prices } = response.data;
      return prices;
    } catch (e) {
      console.error("Coingecko API error:", e.message);
      return [];
    }
  }
}
