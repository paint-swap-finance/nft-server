import { Blockchain, Marketplace } from "../types";
import { handleError } from "../utils";
import dynamodb from "../utils/dynamodb";

const ONE_DAY_MILISECONDS = 86400 * 1000;

export class HistoricalStatistics {
  static async getGlobalStatistics(sortAsc: boolean = true) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "globalStatistics",
        },
        ScanIndexForward: sortAsc,
      })
      .then((result) => result.Items);
  }

  static async getCollectionStatistics(
    slug: string,
    sortDesc: boolean = false
  ) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `statistics#${slug}`,
        },
        ScanIndexForward: sortDesc,
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
      await dynamodb.transactWrite({
        updateItems: [
          {
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
          },
          {
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
          },
        ],
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
    slug,
  }: {
    chain?: string;
    marketplace?: string;
    slug?: string;
  }) {
    if (chain) {
      const globalStatistics = await HistoricalStatistics.getGlobalStatistics();
      return globalStatistics
        .map((statistic) => ({
          timestamp: Math.floor(statistic.SK / 1000),
          volume: statistic[`chain_${chain}_volume`],
          volumeUSD: statistic[`chain_${chain}_volumeUSD`],
        }))
        .filter((statistic) => statistic.volume && statistic.volumeUSD);
    }

    if (marketplace) {
      const globalStatistics = await HistoricalStatistics.getGlobalStatistics();
      return globalStatistics
        .map((statistic) => ({
          timestamp: Math.floor(statistic.SK / 1000),
          volume: statistic[`marketplace_${marketplace}_volume`],
          volumeUSD: statistic[`marketplace_${marketplace}_volumeUSD`],
        }))
        .filter((statistic) => statistic.volume && statistic.volumeUSD);
    }

    if (slug) {
      const statistics = await HistoricalStatistics.getCollectionStatistics(
        slug
      );
      // Sums the volumes and USD volumes from every chain for that collection for every timestamp
      return statistics
        .map((statistic) => {
          const chainKeys = Object.keys(statistic).filter((key) => {
            return key.startsWith("chain_");
          });
          const volume = chainKeys.reduce((volume, key) => {
            if (key.endsWith("volume")) {
              volume += statistic[key];
            }
            return volume;
          }, 0);
          const volumeUSD = chainKeys.reduce((volumeUSD, key) => {
            if (key.endsWith("volumeUSD")) {
              volumeUSD += statistic[key];
            }
            return volumeUSD;
          }, 0);

          return {
            timestamp: Math.floor(statistic.SK / 1000),
            volume,
            volumeUSD,
          };
        })
        .filter((statistic) => statistic.volume && statistic.volumeUSD);
    }

    const globalStatistics = await HistoricalStatistics.getGlobalStatistics();
    return globalStatistics.map((statistic) => ({
      timestamp: Math.floor(statistic.SK / 1000),
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
