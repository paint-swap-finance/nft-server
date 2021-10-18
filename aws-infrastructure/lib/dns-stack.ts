import * as cdk from "@aws-cdk/core";
import * as route53 from '@aws-cdk/aws-route53';
import { Duration } from "@aws-cdk/core";

export interface DNSStackProps extends cdk.StackProps {
  nftApiDomainName: string;
}

export class DNSStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: DNSStackProps) {
    super(scope, id, props)
    const llamaZone = route53.HostedZone.fromLookup(this, 'MyZone', {
      domainName: 'llama.fi'
    });

    new route53.CnameRecord(this, 'CNAMERecord', {
      domainName: props.nftApiDomainName,
      zone: llamaZone,
      comment: 'DNS for NFT API',
      recordName: 'nft.api.llama.fi',
      ttl: Duration.minutes(6),
    });
  }
}