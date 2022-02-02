import axios from "axios";
import { Block } from "web3-eth";

export const sleep = async (seconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export function timestamp(): number {
  return Math.round(Date.now() / 1000);
}

export function roundUSD(num: number): number {
  return Math.round(num ?? 0);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCDate() === d2.getUTCDate() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCFullYear() === d2.getUTCFullYear()
  );
}

export function getSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

export function getSlugFromPK(PK: string): string {
  return PK.split("#")[1];
}

export function convertByDecimals(value: number, decimals: number): number {
  return value / Math.pow(10, decimals);
}

// TODO optimize
export function getPriceAtDate(
  date: number,
  historicalPrices: number[][] // [0] is a UNIX timestamp, [1] is the price
): number | null {
  const givenDate = new Date(date);

  const match = historicalPrices.find((priceArr) => {
    const historicalDate = new Date(priceArr[0]);
    return isSameDay(givenDate, historicalDate);
  });

  if (match) {
    return match[1];
  }

  return null;
}

export async function handleError(error: Error, context: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      console.error(`Error [${context}] - not found: ${error.message}`);
    }
    if (error.response?.status === 429) {
      // Backoff for 1 minute if rate limited
      console.error(`Error [${context}] - too many requests: ${error.message}`);
      await sleep(60);
    }
    if (error.response?.status === 500 || error.response.status === 504) {
      console.error(`Error [${context}] - server error: ${error.message}`);
    }
  }
  console.error(`Error [${context}] - other error: ${error.message}`);
}

export function filterObject(object: Object) {
  return Object.fromEntries(
    Object.entries(object).filter(([_, v]) => v != null)
  );
}

export const getTimestampsInBlockSpread = async (
  oldestBlock: Block,
  newestBlock: Block,
  llamaId: string
) => {
  const oldestTimestamp = new Date(
    (oldestBlock.timestamp as number) * 1000
  ).setUTCHours(0, 0, 0, 0);
  const newestTimestamp = new Date(
    (newestBlock.timestamp as number) * 1000
  ).setUTCHours(0, 0, 0, 0);

  const timestamps: Record<string, number> = {};

  for (
    let timestamp = oldestTimestamp;
    timestamp <= newestTimestamp;
    timestamp += 86400 * 1000
  ) {
    if (timestamp) {
      const response = await axios.get(
        `https://coins.llama.fi/block/${llamaId}/${Math.floor(
          timestamp / 1000
        )}`
      );
      const { height } = response.data;
      timestamps[height] = timestamp;
    }
  }
  return timestamps;
};
