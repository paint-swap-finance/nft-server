import axios from "axios";

export class Coingecko {
  private static ETH_ENDPOINT = "https://api.coingecko.com/api/v3/coins/ethereum";
  private static SOL_ENDPOINT = "https://api.coingecko.com/api/v3/coins/solana";

  public static async getEthPrice(): Promise<number> {
    const response = await axios.get(Coingecko.ETH_ENDPOINT);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }

  public static async getSolPrice(): Promise<number> {
    const response = await axios.get(Coingecko.SOL_ENDPOINT);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }
}
