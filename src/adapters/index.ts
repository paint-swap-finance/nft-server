import MoralisAdapter from "./moralis-adapter";
import OpenseaAdapter from "./opensea-adapter";
import MagicEdenAdapter from "./magic-eden-adapter";
import ImmutableXAdapter from "./immutablex-adapter";
import PancakeSwapAdapter from "./pancakeswap-adapter";
import TreasureAdapter from "./treasure-adapter";
import RandomEarthAdapter from "./random-earth-adapter";
import HistoricalStatisticCalculatorAdapter from "./historical-statistic-calculator-adapter";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  //CurrencyConverterAdapter,
  PancakeSwapAdapter,
  //MoralisAdapter,
  //OpenseaAdapter,
  //MagicEdenAdapter,
  //ImmutableXAdapter,
  //TreasureAdapter,
  //RandomEarthAdapter,
  //HistoricalStatisticCalculatorAdapter,
];

export { adapters };
