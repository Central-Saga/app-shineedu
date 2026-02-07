#!/bin/bash

set -euo pipefail

# ========================================
# SCP DEPLOYMENT SCRIPT (TGZ)
# - Build locally
# - Create tgz of .next
# - Upload to server
# - Extract on server
# ========================================

# Server details
SERVER_USER="shineedu"
SERVER_HOST="103.163.138.211"
SERVER_PORT="45022"
SSH_KEY="$HOME/.ssh/shineedu_id_rsa"
REMOTE_APP_PATH="/home/shineedu/repositories/app-shineedu"

# Local paths
LOCAL_APP_PATH="$(pwd)"
LOCAL_NEXT_DIR="$LOCAL_APP_PATH/.next"
LOCAL_TGZ="$LOCAL_APP_PATH/next-build.tgz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Sanity checks
if [ ! -f "$SSH_KEY" ]; then
  echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
  exit 1
fi

if [ ! -f "$LOCAL_APP_PATH/package.json" ]; then
  echo -e "${RED}❌ package.json not found. Run this script from app-shineedu root.${NC}"
  exit 1
fi

# Build
echo -e "${YELLOW}🏗  Running npm run build...${NC}"
npm run build

# Ensure .next exists
if [ ! -d "$LOCAL_NEXT_DIR" ]; then
  echo -e "${RED}❌ .next folder not found after build${NC}"
  exit 1
fi

# Create tgz
echo -e "${YELLOW}📦 Creating next-build.tgz...${NC}"
rm -f "$LOCAL_TGZ"
tar -czf "$LOCAL_TGZ" -C "$LOCAL_APP_PATH" .next

# Upload tgz
echo -e "${YELLOW}📤 Uploading next-build.tgz...${NC}"
scp -P "$SERVER_PORT" -i "$SSH_KEY" -o IdentitiesOnly=yes \
  "$LOCAL_TGZ" \
  "$SERVER_USER@$SERVER_HOST:$REMOTE_APP_PATH/"

# Extract on server
echo -e "${YELLOW}🧩 Extracting on server...${NC}"
ssh -p "$SERVER_PORT" -i "$SSH_KEY" -o IdentitiesOnly=yes \
  "$SERVER_USER@$SERVER_HOST" \
  "rm -rf '$REMOTE_APP_PATH/.next' && tar -xzf '$REMOTE_APP_PATH/next-build.tgz' -C '$REMOTE_APP_PATH'"

echo -e "${GREEN}✅ Deploy completed. Please restart the app from panel.${NC}"
