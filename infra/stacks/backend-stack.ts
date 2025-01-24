import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { BaseStack } from './base-stack';
import { ChatbotApi } from '../constructs/chatbot-api';
import { MeetyBot } from '../constructs/meety-bot';

export class BackendStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const meetingsTable = new dynamodb.Table(this, 'MeetingsTable', {
      tableName: `${this.appName}Meetings`,
      partitionKey: { name: 'meetingId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    meetingsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'CognitoUserPool', {
      userPoolName: 'ml-chatbot-aws-lex-user-pool',
      selfSignUpEnabled: false,
      autoVerify: { email: true },
      signInAliases: { email: true },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireDigits: false,
        requireSymbols: false,
        requireUppercase: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      mfa: cognito.Mfa.OFF,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      email: cognito.UserPoolEmail.withCognito(),
      userInvitation: {
        emailSubject: 'Chapter7 - Your temporary password',
        emailBody:
          'Hello {username} from the Chatbot Application.\nYour temporary password is {####}',
      },
      standardAttributes: {
        email: { required: true, mutable: true },
      }
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'CognitoUserPoolClient', {
      userPool,
      userPoolClientName: `${this.appName}-user-pool-client`.toLowerCase(),
      generateSecret: false,
    });

    // User Pool User
    new cognito.CfnUserPoolUser(this, 'CognitoUserPoolUser', {
      userPoolId: userPool.userPoolId,
      username: this.config.enviroment.useremail,
      desiredDeliveryMediums: ['EMAIL'],
      forceAliasCreation: true,
      userAttributes: [
        {
          name: 'email',
          value: this.config.enviroment.useremail,
        },
        {
          name: 'email_verified',
          value: 'true'
        },
      ],
    });

    const meetyBot = new MeetyBot(this, 'MeetyBot', {
      table: meetingsTable,
    });

    // Chatbot API
    const chatbotApi = new ChatbotApi(this, 'ChatbotApi', {
      meetingsTable,
      userPool,
      userPoolClient,
      meetyBot: meetyBot.bot,
      meetyBotAlias: meetyBot.botAlias,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: chatbotApi.httpApi.url!,
      description: 'The URL of the HTTP API',
      exportName: `${this.appName}ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'The ID of the Cognito User Pool',
      exportName: `${this.appName}CognitoUserPoolId`,
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'The ID of the Cognito User Pool Client',
      exportName: `${this.appName}CognitoUserPoolClientId`,
    });
  }
}