import { Collection, HistoricalStatistics } from "../models";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";
import { Marketplace } from "../types";
import { MARKETPLACE_CHAINS } from "../constants";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const globalStatistics = await HistoricalStatistics.getGlobalStatistics();
    const collectionCount = await Collection.getCount();
    const marketplaces = Object.entries(Marketplace).map((marketplace) => ({
      displayName: marketplace[0],
      marketplace: marketplace[1],
      chains: MARKETPLACE_CHAINS[marketplace[1]],
    }));

    const marketplacesData = marketplaces.reduce(
      (data: any, marketplace: any) => {
        const collections =
          collectionCount.find(
            (count) => count.SK === `marketplace#${marketplace.marketplace}`
          )?.collections ?? 0;

        const mostRecentStatistic =
          globalStatistics[globalStatistics.length - 1] ?? {};
        const dailyVolumeUSD =
          `marketplace_${marketplace.marketplace}_volumeUSD` in
          mostRecentStatistic
            ? mostRecentStatistic[
                `marketplace_${marketplace.marketplace}_volumeUSD`
              ]
            : 0;
        const totalVolumeUSD = globalStatistics.reduce((volume, entry) => {
          return (
            volume +
            (entry[`marketplace_${marketplace.marketplace}_volumeUSD`] ?? 0)
          );
        }, 0);

        data.push({
          ...marketplace,
          collections,
          dailyVolumeUSD,
          totalVolumeUSD,
        });
        return data;
      },
      []
    );

    return successResponse(marketplacesData);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
