import * as cdk from "@aws-cdk/core";
import * as EB from "@aws-cdk/aws-elasticbeanstalk";
import * as S3Assets from "@aws-cdk/aws-s3-assets";

import { Credentials } from "./credentials-stack";

export interface EbsStackProps extends cdk.StackProps {
  credentials: Credentials;
  dbHost: string;
  dbPort: string;
  dbName: string;
}

export class EbsStack extends cdk.Stack {
  readonly loadBalancerURL: string;

  constructor(scope: cdk.Construct, id: string, props: EbsStackProps) {
    super(scope, id, props);

    const username = props.credentials.username.secretValue.toString();
    const password = props.credentials.password.secretValue;
    const openseaApiKey = props.credentials.openseaApiKey.secretValue.toString();
    const moralisAppId = props.credentials.moralisAppId.secretValue.toString();
    const moralisServerURL = props.credentials.moralisServerURL.secretValue.toString();
    const ethereumRPC = props.credentials.ethereumRPC.secretValue.toString();

    const environmentVariables: Record<string, any> = {
      DB_USER: username,
      DB_PASSWORD: password,
      DB_NAME: props.dbName,
      DB_HOST: props.dbHost,
      DB_PORT: props.dbPort,
      DB_SCHEMA: username,
      OPENSEA_API_KEY: openseaApiKey,
      MORALIS_APP_ID: moralisAppId,
      MORALIS_SERVER_URL: moralisServerURL,
      ETHEREUM_RPC: ethereumRPC,
    };

    const environmentOptions = Object.keys(environmentVariables).map(
      (variable) => {
        return {
          namespace: "aws:elasticbeanstalk:application:environment",
          optionName: variable,
          value: environmentVariables[variable],
        };
      }
    );

    const applicationName = "nft-server";

    const assets = new S3Assets.Asset(this, `${applicationName}-assets`, {
      path: "../dist/deploy.zip",
      exclude: ["node_modules",],
    });

    const application = new EB.CfnApplication(this, `${applicationName}-app`, {
      applicationName,
    });

    const appVersionProps = new EB.CfnApplicationVersion(
      this,
      `${applicationName}-version`,
      {
        applicationName,
        sourceBundle: {
          s3Bucket: assets.s3BucketName,
          s3Key: assets.s3ObjectKey,
        },
      }
    );

    const options: EB.CfnEnvironment.OptionSettingProperty[] = [
      {
        namespace: "aws:autoscaling:launchconfiguration",
        optionName: "IamInstanceProfile",
        value: "aws-elasticbeanstalk-ec2-role",
      },
      {
        namespace: "aws:ec2:instances",
        optionName: "InstanceTypes",
        value: "m4.large",
      },
    ];

    const environment = new EB.CfnEnvironment(this, `${applicationName}-environment`, {
      environmentName: "production",
      applicationName: application.applicationName || applicationName,
      solutionStackName: "64bit Amazon Linux 2 v5.4.6 running Node.js 14",
      optionSettings: [...options, ...environmentOptions],
      versionLabel: appVersionProps.ref,
    });
    this.loadBalancerURL = environment.attrEndpointUrl

    appVersionProps.addDependsOn(application);
  }
}
