#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from './stacks/backend-stack';
import { FrontendStack } from './stacks/frontend-stack';

import path = require('path');
import * as fs from 'fs';

const app = new cdk.App();

const configFilePath = app.node.tryGetContext("configFilePath");
if (!configFilePath) {
    throw new Error("'configFilePath' not found in context.");
}

const resolvedPath = path.resolve(__dirname, `../${configFilePath}`);
const config = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
app.node.setContext("config", config);

new BackendStack(app, 'BackendStack');
new FrontendStack(app, 'FrontendStack');