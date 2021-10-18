import * as cdk from '@aws-cdk/core';
import { EbsStackProps, EbsStack } from "./ebs-stack";
import { CredentialsStack } from "./credentials-stack";
import { DNSStack } from "./dns-stack";
import { RdsStack } from "./rds-stack";
import { VpcStack } from "./vpc-stack";

export class AwsInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpcStack = new VpcStack(scope, "VpcStack", { env: props?.env });
    const vpc = vpcStack.vpc;

    const credentialsStack = new CredentialsStack(
      scope,
      "CredentialsStack"
    );

    const rdsStack = new RdsStack(scope, "RdsStack", {
      credentials: credentialsStack.credentials,
      vpc,
      env: props?.env
    });

    const dbInstance = rdsStack.postgreSQLinstance;

    const ebsEnvironment: EbsStackProps = {
      credentials: credentialsStack.credentials,
      dbName: credentialsStack.credentials.username.secretValue.toString(),
      dbHost: dbInstance.instanceEndpoint.hostname.toString(),
      dbPort: "5432",
      env: props?.env,
    };

    const eb = new EbsStack(scope, "EbsStack", ebsEnvironment);
    new DNSStack(scope, 'DnsStack', { nftApiDomainName: eb.loadBalancerURL, env: props?.env } )
  }
}
