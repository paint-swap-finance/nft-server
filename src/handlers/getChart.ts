import { HistoricalStatistics } from "../models";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const { chain, marketplace, slug } = event?.pathParameters || {};
    const chart = await HistoricalStatistics.getChart({
      chain,
      marketplace,
      slug,
    });
    return successResponse(chart, 10 * 60);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
