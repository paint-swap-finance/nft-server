import PancakeSwapAdapter from "./pancakeswap";
import TreasureAdapter from "./treasure";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  TreasureAdapter,
  PancakeSwapAdapter,
];

export { adapters };
