import { Blockchain, Marketplace } from "../types";
import { handleError } from "../utils";
import dynamodb from "../utils/dynamodb";

const ONE_DAY_MILISECONDS = 86400 * 1000;

export class HistoricalStatistics {
  static async getGlobalStatistics() {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "globalStatistics",
        },
        ScanIndexForward: false,
      })
      .then((result) => result.Items);
  }

  static async updateCollectionStatistics({
    slug,
    chain,
    marketplace,
    volumes,
  }: {
    slug: string;
    chain: Blockchain;
    marketplace: Marketplace;
    volumes: any;
  }) {
    for (const timestamp in volumes) {
      const { volume, volumeUSD } = volumes[timestamp];
      await dynamodb.update({
        Key: {
          PK: `statistics#${slug}`,
          SK: timestamp,
        },
        UpdateExpression: `
          ADD chain_${chain}_volume :volume,
              chain_${chain}_volumeUSD :volumeUSD,
              marketplace_${marketplace}_volume :volume,
              marketplace_${marketplace}_volumeUSD :volumeUSD
        `,
        ExpressionAttributeValues: {
          ":volume": volume,
          ":volumeUSD": volumeUSD,
        },
      });

      await dynamodb.update({
        Key: {
          PK: `globalStatistics`,
          SK: timestamp,
        },
        UpdateExpression: `
          ADD chain_${chain}_volume :volume,
              chain_${chain}_volumeUSD :volumeUSD,
              marketplace_${marketplace}_volume :volume,
              marketplace_${marketplace}_volumeUSD :volumeUSD
        `,
        ExpressionAttributeValues: {
          ":volume": volume,
          ":volumeUSD": volumeUSD,
        },
      });
    }
  }

  static async updateStatistics({
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
    try {
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
        const startOfDay = timestamp - (timestamp % ONE_DAY_MILISECONDS);
        volumes[startOfDay] = {
          volume: (volumes[startOfDay]?.volume || 0) + sale.priceBase,
          volumeUSD: (volumes[startOfDay]?.volumeUSD || 0) + sale.priceUSD,
        };
      }

      await HistoricalStatistics.updateCollectionStatistics({
        slug,
        chain,
        marketplace,
        volumes,
      });
    } catch (e) {
      handleError(e, "historical-statistics-model:updateStatistics");
    }
  }

  static async getChart({
    chain,
    marketplace,
  }: {
    chain?: any;
    marketplace?: any;
  }) {
    const globalStatistics = await dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "globalStatistics",
        },
      })
      .then((result) => result.Items);

    if (chain) {
      return globalStatistics.map((statistic) => ({
        timestamp: statistic.SK,
        volume: statistic[`chain_${chain}_volume`],
        volumeUSD: statistic[`chain_${chain}_volumeUSD`],
      }));
    }

    if (marketplace) {
      return globalStatistics.map((statistic) => ({
        timestamp: statistic.SK,
        volume: statistic[`marketplace_${marketplace}_volume`],
        volumeUSD: statistic[`marketplace_${marketplace}_volumeUSD`],
      }));
    }

    return globalStatistics.map((statistic) => ({
      timestamp: statistic.SK,
      volume: Object.entries(statistic).reduce((volume, entry) => {
        if (entry[0].startsWith("chain") && entry[0].endsWith("volume")) {
          return volume + entry[1];
        }
        return volume;
      }, 0),
      volumeUSD: Object.entries(statistic).reduce((volumeUSD, entry) => {
        if (entry[0].startsWith("chain") && entry[0].endsWith("volumeUSD")) {
          return volumeUSD + entry[1];
        }
        return volumeUSD;
      }, 0),
    }));
  }
}
