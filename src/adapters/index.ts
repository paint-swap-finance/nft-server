import HistoricalStatisticCalculatorAdapter from "./historical-statistic-calculator-adapter";
import MoralisAdapter from "./moralis-adapter";
import OpenseaAdapter from "./opensea-adapter";
import MagicEdenAdapter from "./magic-eden-adapter";
import ImmutableXAdapter from "./immutablex-adapter";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  MoralisAdapter,
  OpenseaAdapter,
  MagicEdenAdapter,
  ImmutableXAdapter,
  HistoricalStatisticCalculatorAdapter,
];

export { adapters };
