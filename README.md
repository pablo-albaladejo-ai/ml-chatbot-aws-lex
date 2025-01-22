# Chapter 7 CDK Project: Implementing a Chatbot Using Machine Learning

This project implements the architecture described in Chapter 7 of the **AWS Cloud Projects** book by Ivo Pinto Profile and Pedro Santos. The code is based on the examples provided in Chapter 7, and the original book code can be found here: [AWS Cloud Projects GitHub Repository](https://github.com/PacktPublishing/AWS-Cloud-Projects/tree/main/chapter7/code).

## Architecture Overview

The architecture includes the following components:

- **Amazon S3**: Hosts the frontend of the chatbot.
- **Amazon CloudFront**: Distributes the chatbot frontend globally with low latency.
- **Amazon DynamoDB**: Stores session data and user interactions.
- **Amazon Cognito**: Manages user authentication.
- **Amazon API Gateway**: Provides a REST API interface for backend services.
- **AWS Lambda**: Processes API requests and communicates with Amazon Lex.
- **Amazon Lex**: Provides the conversational interface for the chatbot.

## Features

- A globally distributed frontend served through Amazon CloudFront.
- Secure user authentication with Amazon Cognito.
- Serverless backend using AWS Lambda and Amazon Lex.
- Scalable session management with Amazon DynamoDB.

## Prerequisites

To deploy this project, ensure you have the following installed:

- AWS CLI (version 2)
- Node.js (version 18 or newer)
- AWS CDK (version 2.x)
- A valid AWS account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Dependencies

Navigate to the root of the project and run:

```bash
npm install
```

### 3. Configure AWS Credentials

Ensure your AWS credentials are set up correctly by running:

```bash
aws configure
```

### 4. Deploy the CDK Stack

Deploy the infrastructure using the AWS CDK:

```bash
cdk deploy
```

### 5. Access the Chatbot

After deployment, you will receive the CloudFront distribution URL. Use this URL to access the chatbot frontend.

## Testing

### Unit Tests

Run unit tests for the Lambda functions:

```bash
npm test
```

### Infrastructure Validation

Verify the deployed resources using the AWS CLI or AWS Console.

```bash
aws cloudformation describe-stacks --stack-name Chapter7Stack
```

## Cleaning Up

To remove all resources, run:

```bash
cdk destroy
```

## Future Enhancements

- Add multilingual support to the chatbot.
- Extend functionality to maintain user profiles for personalized interactions.
- Implement additional conversational flows using Amazon Lex.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
