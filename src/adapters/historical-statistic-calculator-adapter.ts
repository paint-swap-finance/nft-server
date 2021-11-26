import { Collection } from "../models/collection";
import { HistoricalStatistic } from "../models/historical-statistic";
import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { isSameDay, sleep, roundUSD } from "../utils";
import {
  ETHEREUM_DEFAULT_TOKEN_ADDRESS,
  SOLANA_DEFAULT_TOKEN_ADDRESS,
} from "../constants";

const QUERY = `
insert into historical_statistic (
  timestamp,
  "collectionAddress",
  "dailyVolume",
  floor,
  "marketCap", "dailyVolumeUSD", "marketCapUSD", "floorUSD", "totalVolume", "totalVolumeUSD", "owners",
  "tokenAddress"
)
(
  select
    -- min(slug) as slug,
    -- avg(price) as dailyAverage,
    date_trunc('day', timestamp) as day,
    "collectionAddress",
    sum(price) as dailyVolume,
    percentile_cont(0.20) within group (order by price) as floor,
    0,
    sum("priceUSD") as dailyVolumeUSD,
    0,
    0,
    0,
    0,
    0,
    "paymentTokenAddress"
  from sale
  join collection on sale."collectionAddress" = collection.address
  where price != 0
  and "paymentTokenAddress" = '0x0000000000000000000000000000000000000000'
  or "paymentTokenAddress" = '11111111111111111111111111111111'
  group by "collectionAddress", day, "paymentTokenAddress"
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
    await updateHistoricalStatistics();
    await Collection.query(QUERY);
    await sleep(60 * 60);
  }
}

async function updateHistoricalStatistics(): Promise<void> {
  const ethInUSDPrices = await Coingecko.getHistoricalEthPrices();
  const solInUSDPrices = await Coingecko.getHistoricalSolPrices();
  const historicalStatistics =
    await HistoricalStatistic.getIncompleteHistoricalStatistics();

  console.log("Updating", historicalStatistics.length, "incomplete stats");

  historicalStatistics.forEach(async (s) => {
    if (s.tokenAddress === ETHEREUM_DEFAULT_TOKEN_ADDRESS) {
      const match = ethInUSDPrices.find((e) => {
        const d1 = new Date(e[0]);
        const d2 = new Date(s.timestamp);
        return isSameDay(d1, d2);
      });

      if (match) {
        s.dailyVolumeUSD = BigInt(Math.ceil(s.dailyVolume * match[1])); // Round up so <$1 values aren't continually marked as incomplete
        s.save();
      }
    } else if (s.tokenAddress === SOLANA_DEFAULT_TOKEN_ADDRESS) {
      const match = solInUSDPrices.find((e) => {
        const d1 = new Date(e[0]);
        const d2 = new Date(s.timestamp);
        return isSameDay(d1, d2);
      });

      if (match) {
        s.dailyVolumeUSD = BigInt(Math.ceil(s.dailyVolume * match[1]));
        s.save();
      }
    }
  });
}

// LOL at name
const HistoricalStatisticCalculatorAdapter: DataAdapter = { run };
export default HistoricalStatisticCalculatorAdapter;
