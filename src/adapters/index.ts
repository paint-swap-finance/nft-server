import MoralisAdapter from "./moralis-adapter";
import OpenseaAdapter from "./opensea-adapter";
import MagicEdenAdapter from "./magic-eden-adapter";
import ImmutableXAdapter from "./immutablex-adapter";
import PancakeSwapAdapter from "./pancakeswap-adapter";
import TreasureAdapter from "./treasure-adapter";
import RandomEarthAdapter from "./random-earth-adapter";
import HistoricalStatisticCalculatorAdapter from "./historical-statistic-calculator-adapter";
import CurrencyConverterAdapter from "./currency-converter-adapter";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  MoralisAdapter,
  OpenseaAdapter,
  MagicEdenAdapter,
  ImmutableXAdapter,
  PancakeSwapAdapter,
  TreasureAdapter,
  RandomEarthAdapter,
  HistoricalStatisticCalculatorAdapter,
  CurrencyConverterAdapter,
];

export { adapters };
