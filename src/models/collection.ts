import { Blockchain, Marketplace } from "../types";
import { getSlugFromPK, handleError } from "../utils";
import dynamodb from "../utils/dynamodb";

export class Collection {
  address: string;
  chain: Blockchain;
  slug: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  website: string;
  discordUrl: string;
  telegramUrl: string;
  twitterUsername: string;
  mediumUsername: string;

  static async upsert({
    slug,
    metadata,
    statistics,
    chain,
    marketplace,
  }: {
    slug: string;
    metadata: any;
    statistics: any;
    chain: Blockchain;
    marketplace: Marketplace;
  }) {
    try {
      const existingCollection = await Collection.get(slug);
      const currentTime = Date.now();

      // If collection already exists, update statistics and updatedAt only
      if (existingCollection.length) {
        const updateExpression = `
        SET owners = :owners,
            totalVolume = :totalVolume,
            totalVolumeUSD = :totalVolumeUSD,
            dailyVolume = :dailyVolume,
            dailyVolumeUSD = :dailyVolumeUSD,
            floor = :floor,
            floorUSD = :floorUSD,
            marketCap = :marketCap,
            marketCapUSD = :marketCapUSD,
            updatedAt = :updatedAt`;

        const expressionAttributeValues = {
          ":owners": statistics.owners,
          ":totalVolume": statistics.totalVolume,
          ":totalVolumeUSD": statistics.totalVolumeUSD,
          ":dailyVolume": statistics.dailyVolume,
          ":dailyVolumeUSD": statistics.dailyVolumeUSD,
          ":floor": statistics.floor,
          ":floorUSD": statistics.floorUSD,
          ":marketCap": statistics.marketCap,
          ":marketCapUSD": statistics.marketCapUSD,
          ":updatedAt": currentTime,
        };

        await dynamodb.transactWrite({
          updateItems: [
            {
              Key: {
                PK: `collection#${slug}`,
                SK: "overview",
              },
              UpdateExpression: updateExpression,
              ExpressionAttributeValues: expressionAttributeValues,
            },
            {
              Key: {
                PK: `collection#${slug}`,
                SK: `chain#${chain}`,
              },
              UpdateExpression: updateExpression,
              ExpressionAttributeValues: expressionAttributeValues,
            },
            {
              Key: {
                PK: `collection#${slug}`,
                SK: `marketplace#${marketplace}`,
              },
              UpdateExpression: updateExpression,
              ExpressionAttributeValues: expressionAttributeValues,
            },
          ],
        });
      }

      // If collection doesn't exist, increment collection counts
      // and insert metadata and statistics
      if (!existingCollection.length) {
        await dynamodb.transactWrite({
          updateItems: [
            {
              Key: {
                PK: `collectionCount`,
                SK: `chain#${chain}`,
              },
              UpdateExpression: "ADD collections :no",
              ExpressionAttributeValues: {
                ":no": 1,
              },
            },
            {
              Key: {
                PK: `collectionCount`,
                SK: `marketplace#${marketplace}`,
              },
              UpdateExpression: "ADD collections :no",
              ExpressionAttributeValues: {
                ":no": 1,
              },
            },
          ],
          putItems: [
            {
              PK: `collection#${slug}`,
              SK: "overview",
              category: "collections",
              ...metadata,
              ...statistics,
              createdAt: currentTime,
              updatedAt: currentTime,
            },
            {
              PK: `collection#${slug}`,
              SK: `chain#${chain}`,
              category: `collections#chain#${chain}`,
              ...metadata,
              ...statistics,
              createdAt: currentTime,
              updatedAt: currentTime,
            },
            {
              PK: `collection#${slug}`,
              SK: `marketplace#${marketplace}`,
              category: `collections#marketplace#${marketplace}`,
              ...metadata,
              ...statistics,
              createdAt: currentTime,
              updatedAt: currentTime,
            },
          ],
        });
      }
    } catch (e) {
      handleError(e, "collection-model:upsert");
    }
  }

  static async get(slug: string) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `collection#${slug}`,
        },
      })
      .then((result) => result.Items);
  }

  static async getStatisticsByChain(slug: string, chain: Blockchain) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk and SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `collection#${slug}`,
          ":sk": `chain#${chain}`,
        },
      })
      .then((result) => result.Items[0]);
  }

  static async getStatisticsByMarketplace(
    slug: string,
    marketplace: Marketplace
  ) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk and SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `collection#${slug}`,
          ":sk": `marketplace#${marketplace}`,
        },
      })
      .then((result) => result.Items[0]);
  }

  // TODO Get all when getting sales
  static async getSorted({
    chain,
    marketplace,
    limit = null,
    cursor = null,
  }: {
    chain?: any;
    marketplace?: any;
    limit?: string;
    cursor?: string;
  }) {
    let category = "collections";

    if (chain) {
      category = `collections#chain#${chain}`;
    }
    if (marketplace) {
      category = `collections#marketplace#${marketplace}`;
    }

    if (category) {
      return dynamodb
        .query({
          IndexName: "collectionsIndex",
          KeyConditionExpression: "category = :category",
          ExpressionAttributeValues: {
            ":category": category,
          },
          ScanIndexForward: false,
          ...(limit && { Limit: parseInt(limit) }),
          ...(cursor && { ExclusiveStartKey: JSON.parse(cursor) }),
        })
        .then((result) => {
          const { Items, LastEvaluatedKey } = result;
          return {
            data: Items.map((item: any) => ({
              ...item,
              slug: getSlugFromPK(item.PK),
            })),
            ...(LastEvaluatedKey && { cursor: LastEvaluatedKey }),
          };
        });
    }
  }

  static async getCount() {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `collectionCount`,
        },
      })
      .then((result) => result.Items);
  }
}
