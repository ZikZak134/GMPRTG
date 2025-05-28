#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Generating package-lock.json...${NC}"

# Remove existing node_modules and lock files
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies to generate lock file
npm install

# Check if lock file was created
if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}package-lock.json generated successfully!${NC}"
    
    # Show file size
    ls -lh package-lock.json
    
    echo -e "${YELLOW}You can now commit and deploy:${NC}"
    echo -e "${GREEN}git add package-lock.json${NC}"
    echo -e "${GREEN}git commit -m 'Add package-lock.json'${NC}"
    echo -e "${GREEN}git push origin main${NC}"
else
    echo -e "${RED}Failed to generate package-lock.json${NC}"
    exit 1
fi
