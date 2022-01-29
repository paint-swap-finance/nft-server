import { Collection, HistoricalStatistics } from "../models";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";
import { Blockchain } from "../types";
import { CHAIN_MARKETPLACES } from "../constants";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const globalStatistics = await HistoricalStatistics.getGlobalStatistics();
    const collectionCount = await Collection.getCount();
    const chains = Object.entries(Blockchain).map((chain) => ({
      displayName: chain[0],
      chain: chain[1],
      marketplaces: CHAIN_MARKETPLACES[chain[1]],
    }));

    const chainsData = chains.reduce((data, chain) => {
      const collections =
        collectionCount.find(
          (count: any) => count.SK === `chain#${chain.chain}`
        )?.collections ?? 0;

      const mostRecentStatistic =
        globalStatistics[globalStatistics.length - 1] ?? {};
      const dailyVolumeUSD =
        `chain_${chain.chain}_volumeUSD` in mostRecentStatistic
          ? mostRecentStatistic[`chain_${chain.chain}_volumeUSD`]
          : 0;
      const totalVolumeUSD = globalStatistics.reduce((volume, entry) => {
        return volume + (entry[`chain_${chain.chain}_volumeUSD`] ?? 0);
      }, 0);

      data.push({
        ...chain,
        collections,
        dailyVolumeUSD,
        totalVolumeUSD,
      });

      return data;
    }, []);

    return successResponse(chainsData);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
