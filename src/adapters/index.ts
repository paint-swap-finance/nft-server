import ImmutableXAdapter from "./immutablex";
import TreasureAdapter from "./treasure";
import PancakeSwapAdapter from "./pancakeswap";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  ImmutableXAdapter,
  TreasureAdapter,
  PancakeSwapAdapter,
];

export { adapters };
