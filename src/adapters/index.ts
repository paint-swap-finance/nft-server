import HistoricalStatisticCalculatorAdapter from "./historical-statistic-calculator-adapter";
import MoralisAdapter from "./moralis-adapter";
import OpenseaAdapter from "./opensea-adapter";

export interface DataAdapter {
  run: () => Promise<void>;
}

const adapters: DataAdapter[] = [
  MoralisAdapter,
  OpenseaAdapter,
  HistoricalStatisticCalculatorAdapter,
];

export { adapters };
