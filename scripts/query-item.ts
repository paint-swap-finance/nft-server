import dynamodb from "../src/utils/dynamodb";

const main = async (PK: string, SK: string) => {
  try {
    console.log("Querying item");
    return await dynamodb
    .query({
      KeyConditionExpression: "PK = :pk and SK = :sk",
      ExpressionAttributeValues: {
        ":pk": PK,
        ":sk": SK,
      },
    })
    .then((result) => {
      const results = result.Items;
      return results
    });
  } catch (e) {
    console.log(e.message);
    return "Error querying item";
  }
};

main(
  "adapterState",
  "sales#defi-kingdoms",
).then((result) => console.log(result));
