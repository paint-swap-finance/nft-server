import axios from "axios";
import { handleError } from "../utils";

const OPENSEARCH_DOMAIN = process.env.OPENSEARCH_DOMAIN;
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME;
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD;

const handler = async (event: any) => {
  try {
    const records = event.Records || [];
    const insertCollectionRecords = records.filter(
      (record: any) =>
        record.eventName === "INSERT" &&
        record.dynamodb.NewImage.PK.S.startsWith("collection#") &&
        record.dynamodb.NewImage.SK.S.startsWith("overview")
    );

    console.log(
      `Adding ${insertCollectionRecords.length} documents to search index`
    );

    const auth = Buffer.from(
      `${OPENSEARCH_USERNAME}:${OPENSEARCH_PASSWORD}`,
      "utf-8"
    ).toString("base64");

    for (const record of insertCollectionRecords) {
      const pk = record.dynamodb.NewImage.PK.S;
      const image = record.dynamodb.NewImage;
      const slug = pk.split("#")[1];
      const document = {} as any;

      Object.keys(image).forEach((key) => {
        if (key !== "PK" && key !== "SK") {
          document[key] = image[key].S;
        }
      });

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
      `Successfully added ${insertCollectionRecords.length} documents to search index`
    );
  } catch (e) {
    await handleError(e, "addSearchDocuments");
    return;
  }
};

export { handler };
