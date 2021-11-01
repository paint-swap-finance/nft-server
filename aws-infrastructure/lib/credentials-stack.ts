import * as cdk from "@aws-cdk/core";
import { ISecret, Secret } from "@aws-cdk/aws-secretsmanager";

export interface Credentials {
  username: ISecret;
  password: ISecret;
  openseaApiKey: ISecret;
  secondaryOpenseaApiKey: ISecret;
  moralisAppId: ISecret;
  moralisServerURL: ISecret;
  ethereumRPC: ISecret;
}

export class CredentialsStack extends cdk.Stack {
  readonly credentials: Credentials;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secretUsername = Secret.fromSecretCompleteArn(
      this,
      "NFTDatabaseUsername",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/db/user-eAG65u"
    );

    const secretPassword = Secret.fromSecretCompleteArn(
      this,
      "NFTDatabasePassword",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/db/password-bZMJj4"
    );

    const secretOpenseaApiKey = Secret.fromSecretCompleteArn(
      this,
      "OpenseaApiKey",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/opensea/apiKey-Xerpex"
    );

    const secretSecondaryOpenseaApiKey = Secret.fromSecretCompleteArn(
      this,
      "SecondaryOpenseaApiKey",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/opensea/secondaryApiKey-4E1XhM"
    );

    const secretMoralisAppId = Secret.fromSecretCompleteArn(
      this,
      "MoralisAppId",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/moralis/appId-OGTLqj"
    );

    const secretMoralisServerURL = Secret.fromSecretCompleteArn(
      this,
      "MoralisServerURL",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/moralis/serverUrl-umyUQn"
    );

    const secretEthereumRPC = Secret.fromSecretCompleteArn(
      this,
      "EthereumRPC",
      "arn:aws:secretsmanager:eu-central-1:856461987125:secret:prod/nfts/ethereum/rpc-zHPG4t",
    );

    this.credentials = {
      username: secretUsername,
      password: secretPassword,
      openseaApiKey: secretOpenseaApiKey,
      secondaryOpenseaApiKey: secretOpenseaApiKey,
      moralisAppId: secretMoralisAppId,
      moralisServerURL: secretMoralisServerURL,
      ethereumRPC: secretEthereumRPC,
    };
  }
}