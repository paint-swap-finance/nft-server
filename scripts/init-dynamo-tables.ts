import {
  Collection,
  HistoricalMetric,
  Metric,
  Sale,
} from '../src/models'

async function main(): Promise<void> {
  await Collection.createTable()
  await HistoricalMetric.createTable()
  await Metric.createTable()
  await Sale.createTable()
}

main()
