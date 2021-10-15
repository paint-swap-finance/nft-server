import axios from "axios";

export class Coingecko {
  private static endpoint = "https://api.coingecko.com/api/v3/coins/ethereum";

  public static async getEthPrice(): Promise<number> {
    const response = await axios.get(Coingecko.endpoint);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }
}