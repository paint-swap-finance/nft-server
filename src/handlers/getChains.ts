import { getGlobalStatistics } from "../utils/dynamodb";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";
import { Blockchain } from "../types";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const globalStatistics = await getGlobalStatistics();
    const chains = Object.entries(Blockchain).map((chain) => ({
      displayName: chain[0],
      chain: chain[1],
    }));
    let chainsData = [];

    for (const chain of chains) {
      chainsData.push({
        ...chain,
        dailyVolumeUSD:
          globalStatistics[globalStatistics.length - 1][
            `chain_${chain.chain}_volumeUSD`
          ],
        totalVolumeUSD: globalStatistics.reduce((volume, entry) => {
          return volume + entry[`chain_${chain.chain}_volumeUSD`];
        }, 0),
      });
    }
    return successResponse(chainsData);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;