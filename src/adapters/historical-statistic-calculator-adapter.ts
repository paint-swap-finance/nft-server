import { Collection } from "../models/collection";
import { DataAdapter } from ".";
import { sleep } from "../utils";

const QUERY = `
insert into historical_statistic (
  timestamp,
  "collectionAddress",
  "dailyVolume",
  floor,
  "marketCap", "dailyVolumeUSD", "marketCapUSD", "floorUSD", "totalVolume", "totalVolumeUSD", "owners"
)
(
  select
    -- min(slug) as slug,
    -- avg(price) as dailyAverage,
    date_trunc('day', timestamp) as day,
    "collectionAddress",
    sum(price) as dailyVolume,
    percentile_cont(0.20) within group (order by price) as floor,
    0, 0, 0, 0, 0, 0, 0
  from sale
  join collection on sale."collectionAddress" = collection.address
  where price != 0 and "paymentTokenAddress" = '0x0000000000000000000000000000000000000000'
  group by "collectionAddress", day
)
on conflict("collectionAddress", timestamp)
do update set
  "dailyVolume" = excluded."dailyVolume",
  floor = excluded.floor
;
`;
async function run(): Promise<void> {
  while (true) {
    console.log("Running historical statistic calculator");
    await Collection.query(QUERY);
    await sleep(60 * 60);
  }
}

// LOL at name
const HistoricalStatisticCalculatorAdapter: DataAdapter = { run };
export default HistoricalStatisticCalculatorAdapter;
