export const sleep = async (seconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export function timestamp(): number {
  return Math.round(Date.now() / 1000);
}

export function roundUSD(num: number): number {
  return Math.round(num);
}
