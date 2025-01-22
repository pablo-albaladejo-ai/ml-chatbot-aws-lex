import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lex from 'aws-cdk-lib/aws-lex';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as  apigatewayv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ChatbotApiProps {
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
    meetingsTable: dynamodb.Table;
    meetyBot: lex.CfnBot;
    meetyBotAlias: lex.CfnBotAlias;
}

export class ChatbotApi extends Construct {
    readonly httpApi: apigatewayv2.HttpApi;

    constructor(scope: Construct, id: string, props: ChatbotApiProps) {
        super(scope, id);

        // API Gateway HTTP API
        this.httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
            apiName: 'meety-chatbot-api',
            corsPreflight: {
                allowMethods: [
                    apigatewayv2.CorsHttpMethod.GET,
                    apigatewayv2.CorsHttpMethod.PUT,
                    apigatewayv2.CorsHttpMethod.POST,
                    apigatewayv2.CorsHttpMethod.DELETE,
                    apigatewayv2.CorsHttpMethod.OPTIONS
                ],
                allowOrigins: ['*'],
                allowHeaders: ['*'],
            },
        });

        // Cognito Authorizer
        const jwtIssuer = `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${props.userPool.userPoolId}`;

        const jwtAuthorizer = new apigatewayv2Authorizers.HttpJwtAuthorizer('CognitoAuthorizer', jwtIssuer, {
            authorizerName: 'CognitoAuthorizer',
            jwtAudience: [props.userPoolClient.userPoolClientId],
            identitySource: ['$request.header.Authorization'],
        });

        // change meeting stataus lambda
        const changeMeetingStatusLambda = new lambdaNodejs.NodejsFunction(this, 'ChangeMeetingStatusLambdaFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../codes/lambda/changeMeetingStatus.ts'),
            environment: {
                MEETINGS_TABLE_NAME: props.meetingsTable.tableName,
            },
            bundling: {
                minify: true,
                sourceMap: true,
            },
        });
        props.meetingsTable.grantWriteData(changeMeetingStatusLambda);
        const changeMeetingStatusLambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('ChangeMeetingStatusIntegration', changeMeetingStatusLambda);
        this.httpApi.addRoutes({
            path: '/status',
            methods: [apigatewayv2.HttpMethod.PUT],
            integration: changeMeetingStatusLambdaIntegration,
            authorizer: jwtAuthorizer,
        });

        // chatbot lambda
        const chatbotLambda = new lambdaNodejs.NodejsFunction(this, 'ChatbotLambdaFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../codes/lambda/chatbot.ts'),
            environment: {
                BOT_ID: props.meetyBot.ref,
                BOT_ALIAS_ID: props.meetyBotAlias.attrBotAliasId,
            },
            bundling: {
                minify: true,
                sourceMap: true,
            },
            timeout: cdk.Duration.seconds(60),
        });
        chatbotLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: ['lex:RecognizeText'],
            resources: [
                `arn:aws:lex:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:bot-alias/${props.meetyBot.ref}/${props.meetyBotAlias.attrBotAliasId}`,
            ],
        }));
        const chatbotLambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('ChatbotIntegration', chatbotLambda);
        this.httpApi.addRoutes({
            path: '/chatbot',
            methods: [apigatewayv2.HttpMethod.POST],
            integration: chatbotLambdaIntegration,
        });

        // get meetings lambda
        const getMeetingsLambda = new lambdaNodejs.NodejsFunction(this, 'GetMeetingsLambdaFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../codes/lambda/getMeetings.ts'),
            environment: {
                MEETINGS_TABLE_NAME: props.meetingsTable.tableName,
            },
            bundling: {
                minify: true,
                sourceMap: true,
            },
        });
        props.meetingsTable.grantReadData(getMeetingsLambda);
        const getMeetingsLambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('GetMeetingsIntegration', getMeetingsLambda);
        this.httpApi.addRoutes({
            path: '/meetings',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: getMeetingsLambdaIntegration,
            authorizer: jwtAuthorizer,
        });

        // get pending meetings lambda
        const getPendingMeetingsLambda = new lambdaNodejs.NodejsFunction(this, 'GetPendingMeetingsLambdaFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../codes/lambda/getPendingMeetings.ts'),
            environment: {
                MEETINGS_TABLE_NAME: props.meetingsTable.tableName,
            },
            bundling: {
                minify: true,
                sourceMap: true,
            },
        });
        props.meetingsTable.grantReadData(getPendingMeetingsLambda);
        const getPendingMeetingsLambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('GetPendingMeetingsIntegration', getPendingMeetingsLambda);
        this.httpApi.addRoutes({
            path: '/pending',
            methods: [apigatewayv2.HttpMethod.GET],
            integration: getPendingMeetingsLambdaIntegration,
            authorizer: jwtAuthorizer,
        });

    }
}