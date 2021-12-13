import { getGlobalStatistics, getCollectionCount } from "../utils/dynamodb";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";
import { Marketplace } from "../types";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const globalStatistics = await getGlobalStatistics();
    const collectionCount = await getCollectionCount();
    const marketplaces = Object.entries(Marketplace).map((marketplace) => ({
      displayName: marketplace[0],
      marketplace: marketplace[1],
    }));
    let marketplacesData = [];

    for (const marketplace of marketplaces) {
      marketplacesData.push({
        ...marketplace,
        collections:
          collectionCount.find(
            (count) => count.SK === `marketplace#${marketplace.marketplace}`
          ) ?? 0,
        dailyVolumeUSD:
          globalStatistics[globalStatistics.length - 1][
            `marketplace_${marketplace.marketplace}_volumeUSD`
          ],
        totalVolumeUSD: globalStatistics.reduce((volume, entry) => {
          return (
            volume + entry[`marketplace_${marketplace.marketplace}_volumeUSD`]
          );
        }, 0),
      });
    }
    return successResponse(marketplacesData);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
