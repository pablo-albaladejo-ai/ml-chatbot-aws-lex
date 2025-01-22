import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class BaseStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        cdk.Tags.of(this).add('project', 'ml-chatbot-aws-lex');
        cdk.Tags.of(this).add('group', 'ai-projects');
    }
}

