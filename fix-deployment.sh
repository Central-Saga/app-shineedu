#!/bin/bash

# ========================================
# SCRIPT DEPLOYMENT FIX - App ShineEdu
# ========================================
# Jalankan script ini di server via SSH
# 
# Cara pakai:
# 1. Upload file ini ke server
# 2. chmod +x fix-deployment.sh
# 3. ./fix-deployment.sh
# ========================================

set -e  # Exit on error

echo "🚀 Starting deployment fix..."
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cek apakah file zip ada
if [ ! -f "app-shineedu.zip" ]; then
    echo -e "${RED}❌ Error: app-shineedu.zip not found!${NC}"
    echo "Please upload app-shineedu.zip to this directory first."
    exit 1
fi

echo -e "${GREEN}✅ Found app-shineedu.zip${NC}"
echo ""

# Backup folder .next yang lama
if [ -d ".next" ]; then
    BACKUP_NAME=".next_backup_$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📦 Backing up old .next folder to $BACKUP_NAME${NC}"
    mv .next "$BACKUP_NAME"
    echo -e "${GREEN}✅ Backup created${NC}"
else
    echo -e "${YELLOW}⚠️  No existing .next folder found${NC}"
fi
echo ""

# Hapus file-file lama yang akan di-replace
echo -e "${YELLOW}🗑️  Removing old files...${NC}"
rm -f server.js
rm -f next.config.ts
rm -f next-env.d.ts
rm -f package.json
rm -f package-lock.json
rm -rf public
echo -e "${GREEN}✅ Old files removed${NC}"
echo ""

# Extract zip
echo -e "${YELLOW}📦 Extracting app-shineedu.zip...${NC}"
unzip -o app-shineedu.zip
echo -e "${GREEN}✅ Files extracted${NC}"
echo ""

# Cek apakah folder .next ada dan berisi file
if [ ! -d ".next" ]; then
    echo -e "${RED}❌ Error: .next folder not found after extraction!${NC}"
    exit 1
fi

if [ ! -d ".next/static/chunks" ]; then
    echo -e "${RED}❌ Error: .next/static/chunks folder not found!${NC}"
    exit 1
fi

# Hitung jumlah file JavaScript di chunks
JS_COUNT=$(find .next/static/chunks -name "*.js" | wc -l)
echo -e "${GREEN}✅ Found $JS_COUNT JavaScript files in .next/static/chunks${NC}"

if [ "$JS_COUNT" -lt 10 ]; then
    echo -e "${RED}⚠️  Warning: Only $JS_COUNT JS files found. Expected more.${NC}"
fi
echo ""

# Set permissions yang benar
echo -e "${YELLOW}🔐 Setting correct permissions...${NC}"
chmod -R 755 .next
chmod 644 .next/static/chunks/*.js 2>/dev/null || true
echo -e "${GREEN}✅ Permissions set${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Cek apakah PM2 sudah running
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Restarting PM2...${NC}"
    pm2 restart app-shineedu || pm2 start server.js --name app-shineedu
    echo -e "${GREEN}✅ PM2 restarted${NC}"
    echo ""
    
    # Tunggu sebentar dan cek status
    sleep 2
    pm2 status app-shineedu
    echo ""
    
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    pm2 logs app-shineedu --lines 20 --nostream
else
    echo -e "${YELLOW}⚠️  PM2 not found. Please start the server manually:${NC}"
    echo "   NODE_ENV=production node server.js"
fi

echo ""
echo -e "${GREEN}✨ Deployment fix completed!${NC}"
echo ""
echo -e "${YELLOW}🔍 Next steps:${NC}"
echo "1. Check if the app is running: pm2 status"
echo "2. Monitor logs: pm2 logs app-shineedu"
echo "3. Test in browser: https://app.shineeducationbali.com"
echo ""
echo -e "${YELLOW}📝 Verification checklist:${NC}"
echo "- [ ] PM2 status shows 'online'"
echo "- [ ] No errors in PM2 logs"
echo "- [ ] Website loads without 'Application error'"
echo "- [ ] Browser console shows no 500 errors"
echo ""
