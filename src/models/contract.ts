import { Blockchain, Marketplace } from "../types";
import dynamodb from "../utils/dynamodb";

export class Contract {
  address: string;
  defaultTokenId: string;
  chain: string;

  static async insert(contracts: any) {
    const createdDate = new Date().getTime();
    const batchWriteStep = 25;
    for (let i = 0; i < contracts.length; i += batchWriteStep) {
      const items = contracts
        .slice(i, i + batchWriteStep)
        .map((contract: any) => ({
          PK: `contracts`,
          SK: `${createdDate}#${contract.address}`,
          ...contract,
        }));
      await dynamodb.batchWrite(items);
    }
  }
}
