# 🚀 Favicon Deployment Guide

## Status

✅ **Code pushed to GitHub** (branch: `dev`)

- App Shineedu: Commit `7178526`
- Landing Shineedu: Commit `152fc3d`

## Quick Deploy

### Option 1: Automated Script (Recommended)

```bash
cd /Volumes/The\ Vault/Projects/Shine-Education-Bali
./deploy-favicon.sh
```

Script akan otomatis:

1. SSH ke server production
2. Pull latest code dari git
3. Build aplikasi
4. Restart PM2
5. Verify deployment

### Option 2: Manual Deployment

#### Step 1: SSH ke Server

```bash
ssh root@103.127.132.110
```

#### Step 2: Deploy App Shineedu

```bash
cd /var/www/app-shineedu

# Pull latest changes
git pull origin dev

# Build
npm run build

# Restart
pm2 restart app-shineedu

# Check status
pm2 logs app-shineedu --lines 20
```

#### Step 3: Deploy Landing Shineedu

```bash
cd /var/www/landing-shineedu

# Pull latest changes
git pull origin dev

# Build
npm run build

# Restart
pm2 restart landing-shineedu

# Check status
pm2 logs landing-shineedu --lines 20
```

#### Step 4: Verify PM2 Status

```bash
pm2 status
```

Expected output:

```
┌─────┬────────────────────┬─────────┬─────────┐
│ id  │ name               │ status  │ restart │
├─────┼────────────────────┼─────────┼─────────┤
│ 0   │ app-shineedu       │ online  │ X       │
│ 1   │ landing-shineedu   │ online  │ X       │
└─────┴────────────────────┴─────────┴─────────┘
```

## Verification

### 1. Check Files on Server

```bash
# Verify favicon files exist
ls -la /var/www/app-shineedu/public/favicon_io/
ls -la /var/www/landing-shineedu/public/favicon_io/
```

Expected files:

- ✅ favicon.ico
- ✅ favicon-16x16.png
- ✅ favicon-32x32.png
- ✅ apple-touch-icon.png
- ✅ android-chrome-192x192.png
- ✅ android-chrome-512x512.png
- ✅ site.webmanifest

### 2. Test in Browser

**App Shineedu (Admin Panel):**

1. Visit: https://app.shineeducationbali.com
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+R)
4. Check browser tab - should show Shine Education logo

**Landing Shineedu:**

1. Visit: https://shineeducationbali.com
2. Clear browser cache
3. Hard refresh
4. Check browser tab - should show Shine Education logo

### 3. Test Favicon URLs Directly

```bash
# Test favicon files are accessible
curl -I https://app.shineeducationbali.com/favicon_io/favicon.ico
curl -I https://shineeducationbali.com/favicon_io/favicon.ico
```

Expected: HTTP 200 OK

### 4. Check in Google Search

**Note:** Google Search may take time to update favicon:

- **Immediate:** Favicon appears in browser tab
- **1-2 days:** Favicon may appear in Google Search results
- **1 week:** Favicon should be fully indexed by Google

To speed up indexing:

1. Submit sitemap to Google Search Console
2. Request re-indexing of homepage
3. Ensure `site.webmanifest` is accessible

## Troubleshooting

### Favicon Not Showing in Browser

1. **Clear browser cache completely**

    ```
    Chrome: Ctrl+Shift+Delete → All time → Clear data
    Firefox: Ctrl+Shift+Delete → Everything → Clear
    Safari: Cmd+Option+E
    ```

2. **Hard refresh**

    ```
    Windows: Ctrl+Shift+R
    Mac: Cmd+Shift+R
    ```

3. **Try incognito/private mode**
    - This bypasses cache completely

4. **Check browser console for errors**
    - F12 → Console tab
    - Look for 404 errors on favicon files

### Favicon Not Showing in Google Search

1. **Verify favicon is accessible**

    ```bash
    curl -I https://shineeducationbali.com/favicon_io/favicon.ico
    ```

2. **Check Google Search Console**
    - Go to: https://search.google.com/search-console
    - Check for any errors related to favicon

3. **Request re-indexing**
    - In Search Console, request URL inspection
    - Submit homepage for re-indexing

4. **Wait for Google to crawl**
    - Can take 1-7 days for favicon to appear in search results

### PM2 Not Restarting

```bash
# Check PM2 status
pm2 status

# If not running, start it
pm2 start ecosystem.config.js

# If still issues, restart PM2 daemon
pm2 kill
pm2 resurrect
```

## Files Changed

### App Shineedu

- ✅ `src/app/layout.tsx` - Added favicon metadata
- ✅ `public/favicon_io/*` - Favicon files
- ✅ `docs/FAVICON.md` - Documentation

### Landing Shineedu

- ✅ `app/layout.tsx` - Added favicon metadata
- ✅ `public/favicon_io/*` - Favicon files

## SEO Considerations

### Favicon for SEO

Favicon helps with:

1. **Brand recognition** in search results
2. **Click-through rate** (CTR) improvement
3. **Bookmarks** - easier to identify
4. **Browser tabs** - professional appearance

### Web Manifest for PWA

The `site.webmanifest` file enables:

- Progressive Web App (PWA) installation
- Custom app icon on mobile home screen
- Better mobile experience

### Google Search Integration

For favicon to appear in Google Search:

1. ✅ Favicon must be accessible (not blocked by robots.txt)
2. ✅ Favicon should be square (our files are)
3. ✅ Minimum size: 48x48 pixels (we have 512x512)
4. ✅ Format: ICO, PNG, GIF, JPG, or SVG (we use ICO and PNG)
5. ⏳ Wait for Google to crawl and index

## Next Steps

After deployment:

1. ✅ Verify favicon appears in browser tabs
2. ✅ Test on mobile devices
3. ✅ Check PWA installation works
4. ⏳ Monitor Google Search Console for favicon indexing
5. ⏳ Wait 1-7 days for Google Search to show favicon

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs app-shineedu`
2. Check nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify file permissions: `ls -la public/favicon_io/`
4. Test favicon URLs directly in browser

---

**Last Updated:** 31 Januari 2026, 11:45 WIB
