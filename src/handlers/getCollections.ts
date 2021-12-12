import { getSortedCollections } from "../utils/dynamodb";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const { chain, marketplace } = event?.pathParameters || {};
    const collections = await getSortedCollections({ chain, marketplace });
    return successResponse(collections); // 10 mins cache
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
