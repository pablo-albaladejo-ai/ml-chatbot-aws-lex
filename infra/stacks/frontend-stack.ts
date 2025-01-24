import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { BaseStack } from './base-stack';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import path = require('path');

interface FrontendStackProps extends cdk.StackProps {
    apiGatewayUrl: string;
    cognitoUserPoolId: string;
    cognitoAppClientId: string;
  }

export class FrontendStack extends BaseStack {
    constructor(scope: Construct, id: string, props?: FrontendStackProps) {
        super(scope, id, props);

        // S3 Bucket
        const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
            bucketName: 'ml-chatbot-aws-lex',
            websiteIndexDocument: 'index.html',
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // CloudFront Distribution
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(s3Bucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
                    securityHeadersBehavior: {
                        contentTypeOptions: {
                            override: true,
                        },
                        frameOptions: {
                            frameOption: cloudfront.HeadersFrameOption.DENY,
                            override: true,
                        },
                        referrerPolicy: {
                            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                            override: true,
                        },
                        strictTransportSecurity: {
                            accessControlMaxAge: cdk.Duration.days(365),
                            includeSubdomains: true,
                            preload: true,
                            override: true,
                        },
                        xssProtection: {
                            protection: true,
                            modeBlock: true,
                            override: true,
                        },
                    },
                }),
            },
            defaultRootObject: 'index.html',
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
            ],
        });


        // S3 Deployment
        new s3Deploy.BucketDeployment(this, 'DeployFrontend', {
            sources: [
                s3Deploy.Source.asset(path.join(__dirname, '../../codes/frontend/dist')),
            ],
            destinationBucket: s3Bucket,
            retainOnDelete: false,
            prune: true,
            distribution,
            distributionPaths: ['/*']
        });


        new cdk.CfnOutput(this, 'FrontendURL', {
            value: distribution.distributionDomainName,
            description: 'The URL of the CloudFront distribution for the frontend',
            exportName: 'FrontendURL',
        });

    }
};