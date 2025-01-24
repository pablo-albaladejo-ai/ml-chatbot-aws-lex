#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status.

# Configuration File Path
export APP_CONFIG=$1
echo "Using configuration file: $APP_CONFIG"

export AWS_PROFILE=$(cat $APP_CONFIG | jq -r '.aws.profile')
export AWS_REGION=$(cat $APP_CONFIG | jq -r '.aws.region')
PREFIX=$(cat $APP_CONFIG | jq -r '.app.name')

# Destroy frontend stack
echo "Destroying frontend stack..."
cdk destroy "${PREFIX}FrontendStack" --force

if [ $? -eq 0 ]; then
    echo "Frontend stack destroyed successfully."
else
    echo "Error: Failed to destroy frontend stack."
    exit 1
fi

# Destroy backend stack
echo "Destroying backend stack..."
cdk destroy "${PREFIX}BackendStack" --force

if [ $? -eq 0 ]; then
    echo "Backend stack destroyed successfully."
else
    echo "Error: Failed to destroy backend stack."
    exit 1
fi

echo "Destroy process completed successfully."
