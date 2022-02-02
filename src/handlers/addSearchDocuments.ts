import axios from "axios";
import {
  DynamoDBStreamHandler,
  DynamoDBStreamEvent,
  DynamoDBRecord,
} from "aws-lambda";

import { handleError } from "../utils";

const OPENSEARCH_DOMAIN = process.env.OPENSEARCH_DOMAIN;
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME;
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD;

const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  try {
    const records: DynamoDBRecord[] = event.Records || [];

    // Only consider insert or update events for collection overviews
    const collectionRecords = records.filter(
      (record: DynamoDBRecord) =>
        (record.eventName === "INSERT" || record.eventName === "MODIFY") &&
        record.dynamodb.NewImage.PK.S.startsWith("collection#") &&
        record.dynamodb.NewImage.SK.S.startsWith("overview")
    );

    console.log(
      `Adding or updating ${collectionRecords.length} documents to search index`
    );

    const auth = Buffer.from(
      `${OPENSEARCH_USERNAME}:${OPENSEARCH_PASSWORD}`,
      "utf-8"
    ).toString("base64");

    for (const record of collectionRecords) {
      const pk = record.dynamodb.NewImage.PK.S;
      const image = record.dynamodb.NewImage;
      const slug = pk.split("#")[1];
      const document = {} as any;

      // Only add flattened name, logo, slug, and symbol to search index
      Object.keys(image).forEach((key) => {
        if (["name", "logo", "slug", "symbol"].includes(key)) {
          document[key] = image[key].S;
        }
      });

      // Create new document in collections index or update existing document
      await axios.post(
        `${OPENSEARCH_DOMAIN}/collections/_doc/${slug}`,
        document,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );
    }

    console.log(
      `Successfully added ${collectionRecords.length} documents to search index`
    );
  } catch (e) {
    await handleError(e, "addSearchDocuments");
    return;
  }
};

export default handler;
