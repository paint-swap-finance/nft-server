#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsInfrastructureStack } from '../lib/aws-infrastructure-stack';

const app = new cdk.App();
new AwsInfrastructureStack(app, 'AwsInfrastructureStack', {
  env: { account: '856461987125', region: 'eu-central-1' },

});
