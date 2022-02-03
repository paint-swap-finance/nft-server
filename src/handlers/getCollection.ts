import { APIGatewayProxyEvent } from "aws-lambda";
import { Collection } from "../models";
import {
  successResponse,
  errorResponse,
  IResponse,
} from "../utils/lambda-response";

const handler = async (event: APIGatewayProxyEvent): Promise<IResponse> => {
  try {
    const { slug } = event?.pathParameters || {};
    const collection = await Collection.get(slug);
    return successResponse(collection, 10 * 60);
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
