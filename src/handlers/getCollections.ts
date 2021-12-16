import { Collection } from "../models";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const { chain, marketplace } = event?.pathParameters || {};
    const { limit, cursor } = event?.queryStringParameters || {};
    const collectionsData = await Collection.getSorted({
      chain,
      marketplace,
      limit,
      cursor,
    });
    return successResponse(collectionsData, 10 * 60);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
