#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from './stacks/backend-stack';
import { FrontendStack } from './stacks/frontend-stack';

const app = new cdk.App();

new BackendStack(app, 'BackendStack');
new FrontendStack(app, 'FrontendStack');