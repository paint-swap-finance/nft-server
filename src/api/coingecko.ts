import axios from "axios";

export class Coingecko {
  private static PRICE_ENDPOINT = "https://api.coingecko.com/api/v3/coins";
  private static HISTORICAL_PRICE_PARAMS =
    "market_chart?vs_currency=usd&days=max&interval=daily";

  public static async getEthPrice(): Promise<number> {
    const response = await axios.get(`${Coingecko.PRICE_ENDPOINT}/ethereum`);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }

  public static async getHistoricalEthPrices(): Promise<number[][]> {
    const response = await axios.get(
      `${Coingecko.PRICE_ENDPOINT}/ethereum/${Coingecko.HISTORICAL_PRICE_PARAMS}`
    );
    const { prices } = response.data;
    return prices;
  }

  public static async getSolPrice(): Promise<number> {
    const response = await axios.get(`${Coingecko.PRICE_ENDPOINT}/solana`);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }

  public static async getHistoricalSolPrices(): Promise<number[][]> {
    const response = await axios.get(
      `${Coingecko.PRICE_ENDPOINT}/solana/${Coingecko.HISTORICAL_PRICE_PARAMS}`
    );
    const { prices } = response.data;
    return prices;
  }

  public static async getBnbPrice(): Promise<number> {
    const response = await axios.get(`${Coingecko.PRICE_ENDPOINT}/binancecoin`);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }

  public static async getHistoricalBnbPrices(): Promise<number[][]> {
    const response = await axios.get(
      `${Coingecko.PRICE_ENDPOINT}/binancecoin/${Coingecko.HISTORICAL_PRICE_PARAMS}`
    );
    const { prices } = response.data;
    return prices;
  }

  public static async getHistoricalPricesByAddress(
    platform: string,
    address: string,
    base: string
  ): Promise<number[][]> {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}/market_chart/?vs_currency=${base}&days=max`
    );
    const { prices } = response.data;
    return prices;
  }
}
