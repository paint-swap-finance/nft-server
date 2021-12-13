import MoralisAdapter from "./moralis-adapter";
import OpenseaAdapter from "./opensea-adapter";
import MagicEdenAdapter from "./magic-eden-adapter";
import ImmutableXAdapter from "./immutablex-adapter";
import PancakeSwapAdapter from "./pancakeswap-adapter";
import TreasureAdapter from "./treasure-adapter";
import RandomEarthAdapter from "./random-earth-adapter";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  PancakeSwapAdapter,
  //MoralisAdapter,
  //OpenseaAdapter,
  //MagicEdenAdapter,
  //ImmutableXAdapter,
  //TreasureAdapter,
  //RandomEarthAdapter,
];

export { adapters };
