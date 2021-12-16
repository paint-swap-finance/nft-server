import { Marketplace } from "../types";
import { handleError } from "../utils";
import dynamodb from "../utils/dynamodb";

export class Sale {
  txnHash: string;
  sellerAddress: string;
  buyerAddress: string;
  marketplace: Marketplace;
  price: number;
  priceBase: number;
  priceUSD: number;
  paymentTokenAddress: string;
  excluded: boolean;

  static async insert({
    slug,
    marketplace,
    sales,
  }: {
    slug: string;
    marketplace: Marketplace;
    sales: any[];
  }) {
    try {
      const batchWriteStep = 25;
      for (let i = 0; i < sales.length; i += batchWriteStep) {
        const items = sales
          .slice(i, i + batchWriteStep)
          .reduce((sales: any, sale) => {
            const { timestamp, txnHash, ...data } = sale;
            const sortKeys = sales.map((sale: any) => sale.SK);
            const sortKey = `${timestamp}#txnHash#${txnHash}`;
            if (!sortKeys.includes(sortKey)) {
              sales.push({
                PK: `sales#${slug}#marketplace#${marketplace}`,
                SK: sortKey,
                ...data,
              });
            }
            return sales;
          }, []);
        await dynamodb.batchWrite(items);
      }
      return true;
    } catch (e) {
      handleError(e, "sale-model: insert");
      return false;
    }
  }

  static async getLastSaleTime({
    slug,
    marketplace,
  }: {
    slug: string;
    marketplace: Marketplace;
  }) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `sales#${slug}#marketplace#${marketplace}`,
        },
        Limit: 1,
        ScanIndexForward: false,
      })
      .then((result) => {
        const results = result.Items;
        if (results.length) {
          return results[0]?.SK?.split("#")[0];
        }
        return "0";
      });
  }
}
