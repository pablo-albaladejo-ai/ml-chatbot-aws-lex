import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as iam from 'aws-cdk-lib/aws-iam';
import * as lex from 'aws-cdk-lib/aws-lex';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import path = require('path');

export interface MeetyBotProps {
    readonly table: dynamodb.Table;
}

export class MeetyBot extends Construct {
    readonly bot: lex.CfnBot;
    readonly botVersion: lex.CfnBotVersion;
    readonly botAlias: lex.CfnBotAlias;
    readonly botFulfillmentLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: MeetyBotProps) {
        super(scope, id);


        this.botFulfillmentLambda = new lambdaNodejs.NodejsFunction(this, 'BotFulfillmentLambda', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../codes/lambda/botFunctionMeety.ts'),
            environment: {
                TABLE_NAME: props.table.tableName,
            },
            bundling: {
                minify: true,
                sourceMap: true,
            },
            timeout: cdk.Duration.seconds(60),
        });
        props.table.grantReadWriteData(this.botFulfillmentLambda);



        const botRole = new iam.Role(this, 'MeetyBotRole', {
            assumedBy: new iam.ServicePrincipal('lexv2.amazonaws.com'),
            inlinePolicies: {
                LexRuntimeRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'polly:SynthesizeSpeech',
                                'comprehend:DetectSentiment',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });

        const botProps: lex.CfnBotProps = {
            name: 'MeetyBot',
            description: 'Meety chatbot',
            roleArn: botRole.roleArn,
            dataPrivacy: {
                ChildDirected: false,
            },
            idleSessionTtlInSeconds: 300,
            autoBuildBotLocales: false,
            botLocales: [
                {
                    localeId: 'en_US',
                    description: 'Meety',
                    nluConfidenceThreshold: 0.6,
                    voiceSettings: {
                        voiceId: 'Ivy',
                    },
                    slotTypes: [
                        {
                            name: 'MeetingDuration',
                            description: 'Meeting Duration',
                            slotTypeValues: [
                                { sampleValue: { value: '30' } },
                                { sampleValue: { value: '60' } },
                            ],
                            valueSelectionSetting: {
                                resolutionStrategy: 'ORIGINAL_VALUE',
                            },
                        },
                    ],
                    intents: [
                        {
                            name: 'StartMeety',
                            description: 'Welcome intent',
                            sampleUtterances: [
                                { utterance: 'Hello' },
                                { utterance: 'Hey Meety' },
                                { utterance: 'I need your help' },
                            ],
                            intentClosingSetting: {
                                isActive: true,
                                closingResponse: {
                                    messageGroupsList: [
                                        {
                                            message: {
                                                plainTextMessage: {
                                                    value:
                                                        "Hey, I'm meety, the chatbot to help scheduling meetings. How can I help you?",
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            name: 'BookMeeting',
                            description: 'Book a meeting',
                            sampleUtterances: [
                                { utterance: 'I want to book a meeting' },
                                { utterance: 'Can I book a slot?' },
                                { utterance: 'Can you help me book a meeting?' },
                            ],
                            slotPriorities: [
                                { priority: 1, slotName: 'FullName' },
                                { priority: 2, slotName: 'MeetingDate' },
                                { priority: 3, slotName: 'MeetingTime' },
                                { priority: 4, slotName: 'MeetingDuration' },
                                { priority: 5, slotName: 'AttendeeEmail' },
                            ],
                            intentConfirmationSetting: {
                                promptSpecification: {
                                    messageGroupsList: [
                                        {
                                            message: {
                                                plainTextMessage: {
                                                    value: 'Do you want to proceed with the meeting?',
                                                },
                                            },
                                        },
                                    ],
                                    maxRetries: 3,
                                    allowInterrupt: true,
                                },
                                declinationResponse: {
                                    messageGroupsList: [
                                        {
                                            message: {
                                                plainTextMessage: {
                                                    value:
                                                        'No worries, I will cancel the request. Please let me know if you want me to restart the process!',
                                                },
                                            },
                                        },
                                    ],
                                    allowInterrupt: false,
                                },
                            },
                            slots: [
                                {
                                    name: 'FullName',
                                    description: 'User Name',
                                    slotTypeName: 'AMAZON.FirstName',
                                    valueElicitationSetting: {
                                        slotConstraint: 'Required',
                                        promptSpecification: {
                                            messageGroupsList: [
                                                {
                                                    message: {
                                                        plainTextMessage: {
                                                            value: 'What is your name?',
                                                        },
                                                    },
                                                },
                                            ],
                                            maxRetries: 3,
                                            allowInterrupt: false,
                                        },
                                    },
                                },
                                {
                                    name: 'MeetingDate',
                                    description: 'Meeting Date',
                                    slotTypeName: 'AMAZON.Date',
                                    valueElicitationSetting: {
                                        slotConstraint: 'Required',
                                        promptSpecification: {
                                            messageGroupsList: [
                                                {
                                                    message: {
                                                        plainTextMessage: {
                                                            value: 'When do you want to meet?',
                                                        },
                                                    },
                                                },
                                            ],
                                            maxRetries: 3,
                                            allowInterrupt: false,
                                        },
                                    },
                                },
                                {
                                    name: 'MeetingTime',
                                    description: 'Meeting Time',
                                    slotTypeName: 'AMAZON.Time',
                                    valueElicitationSetting: {
                                        slotConstraint: 'Required',
                                        promptSpecification: {
                                            messageGroupsList: [
                                                {
                                                    message: {
                                                        plainTextMessage: {
                                                            value: 'What time?',
                                                        },
                                                    },
                                                },
                                            ],
                                            maxRetries: 3,
                                            allowInterrupt: false,
                                        },
                                    },
                                },
                                {
                                    name: 'MeetingDuration',
                                    description: 'Meeting Duration',
                                    slotTypeName: 'MeetingDuration',
                                    valueElicitationSetting: {
                                        slotConstraint: 'Required',
                                        promptSpecification: {
                                            messageGroupsList: [
                                                {
                                                    message: {
                                                        plainTextMessage: {
                                                            value:
                                                                'How long do you want to meet in minutes? (30 or 60)',
                                                        },
                                                    },
                                                },
                                            ],
                                            maxRetries: 3,
                                            allowInterrupt: false,
                                        },
                                    },
                                },
                                {
                                    name: 'AttendeeEmail',
                                    description: 'Attendee Email',
                                    slotTypeName: 'AMAZON.EmailAddress',
                                    valueElicitationSetting: {
                                        slotConstraint: 'Required',
                                        promptSpecification: {
                                            messageGroupsList: [
                                                {
                                                    message: {
                                                        plainTextMessage: {
                                                            value: 'Please provide me your email address.',
                                                        },
                                                    },
                                                },
                                            ],
                                            maxRetries: 3,
                                            allowInterrupt: false,
                                        },
                                    },
                                },
                            ],
                            fulfillmentCodeHook: {
                                enabled: true,
                            },
                        },
                        {
                            name: 'FallbackIntent',
                            description: 'Default intent when no other intent matches',
                            parentIntentSignature: 'AMAZON.FallbackIntent',
                            intentClosingSetting: {
                                isActive: true,
                                closingResponse: {
                                    messageGroupsList: [
                                        {
                                            message: {
                                                plainTextMessage: {
                                                    value:
                                                        'Sorry, I did not get it. I am an expert in scheduling meetings. Do you need help with that?',
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
            ],
        }

        this.bot = new lex.CfnBot(this, 'MeetyBot', botProps);

        this.botVersion = new lex.CfnBotVersion(this, 'MeetyBotVersion', {
            botId: this.bot.attrId,
            botVersionLocaleSpecification: [
                {
                    localeId: 'en_US',
                    botVersionLocaleDetails: {
                        sourceBotVersion: 'DRAFT',
                    },
                },
            ],
        });

        this.botAlias = new lex.CfnBotAlias(this, 'MeetyBotAlias', {
            botId: this.bot.attrId,
            botAliasName: 'Production',
            botVersion: this.botVersion.attrBotVersion,
            description: 'Alias for production environment',
            botAliasLocaleSettings: [
                {
                    localeId: 'en_US',
                    botAliasLocaleSetting: {
                        enabled: true,
                        codeHookSpecification: {
                            lambdaCodeHook: {
                                lambdaArn: this.botFulfillmentLambda.functionArn,
                                codeHookInterfaceVersion: '1.0',
                            }
                        }
                    },
                }],
        });

        this.botFulfillmentLambda.addPermission('LexLambdaPermission', {
            action: 'lambda:InvokeFunction',
            principal: new iam.ServicePrincipal('lexv2.amazonaws.com'),
            sourceArn: this.botAlias.attrArn,
          });
    }
}