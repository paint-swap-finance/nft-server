import { getSortedCollections } from "../utils/dynamodb";
import { successResponse, errorResponse } from "../utils/lambda-response";

const handler = async () => {
  try {
    const collections = await getSortedCollections({});
    return successResponse(collections); // 10 mins cache
  } catch (e) {
    console.log(e);
    return errorResponse({ message: "Error" });
  }
};

export default handler;
