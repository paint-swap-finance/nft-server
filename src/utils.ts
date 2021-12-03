export const sleep = async (seconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export function timestamp(): number {
  return Math.round(Date.now() / 1000);
}

export function roundUSD(num: number): number {
  return Math.round(num ?? 0);
}

export function formatUSD(price: number): bigint {
  return BigInt(roundUSD(price ?? 0));
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

export function getSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

// TODO Rename this to something more meaningful
export function convertByDecimals(value: number, decimals: number): number {
  return value / Math.pow(10, decimals);
}

export function getPriceAtDate(
  date: string,
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
