import aws from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";

export default async function invokeLambda(functionName: string, event: APIGatewayProxyEvent) {
  return new Promise((resolve, _reject) => {
    new aws.Lambda().invoke(
      {
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify(event, null, 2), // pass params
      },
      function (error, data) {
        console.log(error, data);
        resolve(data);
      }
    );
  });
}
