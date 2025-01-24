import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

const capitalize = (name: string): string =>{
    if (!name) return '';
    const lowerCaseName = name.toLowerCase();
    return lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.slice(1);
}
export class BaseStack extends cdk.Stack {
    readonly config: any;
    readonly appName: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        const config = scope.node.tryGetContext('config');
        super(scope,`${config.app.name}${id}`, props);

        this.config = config;
        this.appName = capitalize(config.app.name);

        cdk.Tags.of(this).add('project', this.config.app.project);
        cdk.Tags.of(this).add('group', this.config.app.group);
    }
}

