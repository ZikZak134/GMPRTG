#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying Telegram Parser to Fly.io...${NC}"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}flyctl is not installed. Please run setup.sh first.${NC}"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${RED}Not logged in to Fly.io. Please run setup.sh first.${NC}"
    exit 1
fi

# Deploy the application
echo -e "${YELLOW}Deploying application...${NC}"
flyctl deploy

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    
    # Get the app URL
    APP_URL=$(flyctl info --app telegram-parser | grep -o 'https://.*fly.dev')
    
    echo -e "${GREEN}Your application is now available at:${NC}"
    echo -e "${YELLOW}$APP_URL${NC}"
    
    # Show logs
    echo -e "${YELLOW}Showing recent logs:${NC}"
    flyctl logs --app telegram-parser --instance all
else
    echo -e "${RED}Deployment failed. Please check the logs above for errors.${NC}"
    exit 1
fi
