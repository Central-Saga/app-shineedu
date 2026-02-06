#!/bin/bash

# ========================================
# RSYNC DEPLOYMENT SCRIPT
# ========================================
# Script untuk upload folder .next ke server
# ========================================

set -e

echo "🚀 Starting deployment to production server..."
echo ""

# Server details
SERVER_USER="shineedu"
SERVER_HOST="103.163.138.211"
SERVER_PORT="45022"
SSH_KEY="$HOME/.ssh/shineedu_id_rsa"
REMOTE_PATH="~/app-shineedu"  # Sesuaikan dengan path aplikasi di server

# Local path
LOCAL_NEXT_DIR=".next"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .next exists locally
if [ ! -d "$LOCAL_NEXT_DIR" ]; then
    echo -e "${RED}❌ Error: .next folder not found!${NC}"
    echo "Please run 'npm run build' first."
    exit 1
fi

echo -e "${GREEN}✅ Found .next folder locally${NC}"
echo -e "${YELLOW}📊 Size: $(du -sh $LOCAL_NEXT_DIR | cut -f1)${NC}"
echo ""

# Confirm before upload
echo -e "${YELLOW}⚠️  This will upload .next folder to:${NC}"
echo "   Server: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "   Path: $REMOTE_PATH/.next"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo -e "${YELLOW}📤 Uploading .next folder to server...${NC}"
echo "This may take a few minutes..."
echo ""

# Rsync command
rsync -avz --delete \
    -e "ssh -p $SERVER_PORT -i $SSH_KEY -o IdentitiesOnly=yes" \
    "$LOCAL_NEXT_DIR/" \
    "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/.next/"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Upload completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}🔄 Next steps:${NC}"
    echo "1. SSH to server (you're already connected)"
    echo "2. Navigate to app directory: cd $REMOTE_PATH"
    echo "3. Restart PM2: pm2 restart app-shineedu"
    echo "4. Check logs: pm2 logs app-shineedu --lines 50"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Upload failed!${NC}"
    exit 1
fi
