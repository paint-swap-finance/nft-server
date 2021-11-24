import axios from "axios";

export class Coingecko {
  private static ETH_ENDPOINT = "https://api.coingecko.com/api/v3/coins/ethereum";
  private static ETH_HISTORICAL_ENDPOINT = "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=max&interval=daily"
  private static SOL_ENDPOINT = "https://api.coingecko.com/api/v3/coins/solana";
  private static SOL_HISTORICAL_ENDPOINT = "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=max&interval=daily"

  public static async getEthPrice(): Promise<number> {
    const response = await axios.get(Coingecko.ETH_ENDPOINT);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }

  public static async getHistoricalEthPrices(): Promise<number[][]> {
    const response = await axios.get(Coingecko.ETH_HISTORICAL_ENDPOINT)
    const { prices } = response.data;
    return prices;
  }

  public static async getSolPrice(): Promise<number> {
    const response = await axios.get(Coingecko.SOL_ENDPOINT);
    const { usd } = response.data.market_data.current_price;
    return usd;
  }

  public static async getHistoricalSolPrices(): Promise<number[][]> {
    const response = await axios.get(Coingecko.SOL_HISTORICAL_ENDPOINT)
    const { prices } = response.data;
    return prices;
  }
}
