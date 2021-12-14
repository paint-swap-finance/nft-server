import { Collection } from "../models";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const { chain, marketplace } = event?.pathParameters || {};
    const collections = await Collection.getSorted({ chain, marketplace });
    return successResponse(collections);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
