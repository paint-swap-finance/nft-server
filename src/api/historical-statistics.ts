import { Blockchain, Marketplace } from "../types";
import { updateCollectionStatistics } from "../utils/dynamodb";

const ONE_DAY_SECONDS = 86400;

export class HistoricalStatistics {
  public static async updateStatistics({
    slug,
    chain,
    marketplace,
    sales,
  }: {
    slug: string;
    chain: Blockchain;
    marketplace: Marketplace;
    sales: any[];
  }) {
    const volumes: any = {};
    for (const sale of sales) {
      // Do not count if sale has been marked excluded
      if (sale.excluded) {
        continue;
      }
      // Do not count if sale price is 0 or does not have a USD or base equivalent
      if (sale.price <= 0 || sale.priceBase <= 0 || sale.priceUSD <= 0) {
        continue;
      }
      const timestamp = sale.timestamp;
      const startOfDay = timestamp - (timestamp % ONE_DAY_SECONDS);
      volumes[startOfDay] = {
        volume: (volumes[startOfDay]?.volume || 0) + sale.priceBase,
        volumeUSD: (volumes[startOfDay]?.volumeUSD || 0) + sale.priceUSD,
      };
    }

    await updateCollectionStatistics({
      slug,
      chain,
      marketplace,
      volumes,
    });
  }
}
