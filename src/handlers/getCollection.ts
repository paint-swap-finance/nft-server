import { getCollection } from "../utils/dynamodb";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";

const handler = async (event: any): Promise<IResponse> => {
  try {
    const { slug } = event?.pathParameters || {};
    const collection = await getCollection(slug);
    return successResponse(collection);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
