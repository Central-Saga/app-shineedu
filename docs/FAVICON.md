# Favicon Configuration

## Overview

Custom favicon telah dikonfigurasi untuk menggantikan favicon default Next.js dengan logo Shine Education Bali.

## Files Structure

```
public/
└── favicon_io/
    ├── favicon.ico              # Main favicon (multi-size)
    ├── favicon-16x16.png        # 16x16 favicon
    ├── favicon-32x32.png        # 32x32 favicon
    ├── apple-touch-icon.png     # Apple devices (180x180)
    ├── android-chrome-192x192.png  # Android (192x192)
    ├── android-chrome-512x512.png  # Android (512x512)
    └── site.webmanifest         # Web app manifest
```

## Implementation

### App Shineedu (Admin Panel)

- **File**: `src/app/layout.tsx`
- **Metadata**: Configured with custom icons and manifest
- **Title**: "Shine Edu - Admin Panel"

### Landing Shineedu

- **File**: `app/layout.tsx`
- **Metadata**: Configured with custom icons and manifest
- **Title**: "Shine Education - Bimbingan Belajar Tabanan"

## Supported Platforms

✅ **Desktop Browsers**

- Chrome, Firefox, Safari, Edge
- Displays favicon in browser tab

✅ **Mobile Browsers**

- iOS Safari (apple-touch-icon)
- Android Chrome (android-chrome icons)

✅ **PWA Support**

- Web app manifest configured
- Installable as Progressive Web App

## Testing

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check browser tab** - should show Shine Education logo
4. **Check bookmarks** - should show logo when bookmarked
5. **Mobile home screen** - should show logo when added to home screen

## Troubleshooting

If favicon doesn't appear:

1. Clear browser cache completely
2. Hard refresh the page
3. Close and reopen the browser
4. Check browser console for 404 errors
5. Verify files exist in `/public/favicon_io/` directory

## Notes

- Favicon changes may take time to propagate due to browser caching
- Some browsers cache favicons aggressively
- The `.ico` file supports multiple sizes (16x16, 32x32, 48x48)
- Web manifest enables PWA installation with custom icon
