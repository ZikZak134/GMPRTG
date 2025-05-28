#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying to Fly.io with simplified configuration...${NC}"

# Remove any existing fly.toml backup
rm -f fly.toml.bak

# Deploy with force flag to override any conflicts
echo -e "${YELLOW}Starting deployment...${NC}"
flyctl deploy --force-machines

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    
    # Show app info
    flyctl info --app telegram-parser
    
    # Show recent logs
    echo -e "${YELLOW}Recent logs:${NC}"
    flyctl logs --app telegram-parser --instance all
else
    echo -e "${RED}Deployment failed. Checking logs...${NC}"
    flyctl logs --app telegram-parser --instance all
    exit 1
fi
