import { Blockchain } from "../types";
import dynamodb from "../utils/dynamodb";

export class AdapterState {
  name: string;
  lastSyncedBlockNumber: bigint;

  static createMoralisAdapterState(chain: Blockchain) {
    return dynamodb.put({
      PK: `adapterState`,
      SK: `moralis#${chain}`,
      lastSyncedBlockNumber: 0,
    });
  }
  static getMoralisAdapterState(chain: Blockchain) {
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

  static updateMoralisLastSyncedBlockNumber(
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
        blockNumber,
      },
    });
  }
}
