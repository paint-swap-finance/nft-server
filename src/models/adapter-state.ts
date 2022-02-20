import { Blockchain, Marketplace } from "../types";
import dynamodb from "../utils/dynamodb";

export class AdapterState {
  name: string;
  lastSyncedBlockNumber: bigint;

  static async createMoralisAdapterState(chain: Blockchain) {
    await dynamodb.put({
      PK: `adapterState`,
      SK: `moralis#${chain}`,
      lastSyncedBlockNumber: 0,
    });

    return {
      lastSyncedBlockNumber: 0,
    };
  }

  static async getMoralisAdapterState(chain: Blockchain) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk and SK = :sk",
        ExpressionAttributeValues: {
          ":pk": "adapterState",
          ":sk": `moralis#${chain}`,
        },
      })
      .then((result) => {
        const results = result.Items;
        if (results.length) {
          return results[0];
        }
      });
  }

  static async updateMoralisLastSyncedBlockNumber(
    chain: Blockchain,
    blockNumber: number
  ) {
    return dynamodb.update({
      Key: {
        PK: `adapterState`,
        SK: `moralis#${chain}`,
      },
      UpdateExpression: "SET lastSyncedBlockNumber = :blockNumber",
      ExpressionAttributeValues: {
        ":blockNumber": blockNumber,
      },
    });
  }

  static async createSalesAdapterState(
    marketplace: Marketplace,
    chain: Blockchain = null,
    startBlock: number = 0,
    isMultiChain: boolean = false
  ) {
    if (isMultiChain) {
      await dynamodb.put({
        PK: `adapterState`,
        SK: `sales#chain#${chain}#marketplace#${marketplace}`,
        lastSyncedBlockNumber: startBlock,
      });

      return {
        lastSyncedBlockNumber: startBlock,
      };
    }

    await dynamodb.put({
      PK: `adapterState`,
      SK: `sales#${marketplace}`,
      lastSyncedBlockNumber: startBlock,
    });

    return {
      lastSyncedBlockNumber: startBlock,
    };
  }

  static async getSalesAdapterState(
    marketplace: Marketplace,
    chain: Blockchain = null,
    isMultiChain: boolean = false
  ) {
    if (isMultiChain) {
      return dynamodb
        .query({
          KeyConditionExpression: "PK = :pk and SK = :sk",
          ExpressionAttributeValues: {
            ":pk": "adapterState",
            ":sk": `sales#chain#${chain}#marketplace#${marketplace}`,
          },
        })
        .then((result) => {
          const results = result.Items;
          if (results.length) {
            return results[0];
          }
        });
    }

    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk and SK = :sk",
        ExpressionAttributeValues: {
          ":pk": "adapterState",
          ":sk": `sales#${marketplace}`,
        },
      })
      .then((result) => {
        const results = result.Items;
        if (results.length) {
          return results[0];
        }
      });
  }

  static async updateSalesLastSyncedBlockNumber(
    marketplace: Marketplace,
    blockNumber: number,
    chain: Blockchain = null,
    isMultiChain: boolean = false
  ) {
    if (isMultiChain) {
      return dynamodb.update({
        Key: {
          PK: `adapterState`,
          SK: `sales#chain#${chain}#marketplace#${marketplace}`,
        },
        UpdateExpression: "SET lastSyncedBlockNumber = :blockNumber",
        ExpressionAttributeValues: {
          ":blockNumber": blockNumber,
        },
      });
    }

    return dynamodb.update({
      Key: {
        PK: `adapterState`,
        SK: `sales#${marketplace}`,
      },
      UpdateExpression: "SET lastSyncedBlockNumber = :blockNumber",
      ExpressionAttributeValues: {
        ":blockNumber": blockNumber,
      },
    });
  }
}
