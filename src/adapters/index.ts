import RandomEarthAdapter from "./random-earth";
import MagicEdenAdapter from "./magic-eden";
import ImmutableXAdapter from "./immutablex";
import TreasureAdapter from "./treasure";
import PancakeSwapAdapter from "./pancakeswap";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  RandomEarthAdapter,
  MagicEdenAdapter,
  ImmutableXAdapter,
  TreasureAdapter,
  PancakeSwapAdapter,
];

export { adapters };
