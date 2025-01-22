#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status.

# Configuration File Path
export APP_CONFIG=$1

USER_EMAIL=$(cat $APP_CONFIG | jq -r '.Project.UserEmail')
export AWS_PROFILE=$(cat $APP_CONFIG | jq -r '.Project.Profile')

# Set the AWS profile
AWS_REGION=$(aws configure get region)
echo "AWS Region: $AWS_REGION"

# Destroy frontend stack
echo "Destroying frontend stack..."
cdk destroy FrontendStack --force

if [ $? -eq 0 ]; then
    echo "Frontend stack destroyed successfully."
else
    echo "Error: Failed to destroy frontend stack."
    exit 1
fi

# Destroy backend stack
echo "Destroying backend stack..."
cdk destroy BackendStack --force

if [ $? -eq 0 ]; then
    echo "Backend stack destroyed successfully."
else
    echo "Error: Failed to destroy backend stack."
    exit 1
fi

echo "Destroy process completed successfully."
