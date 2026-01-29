#!/bin/sh

# Ensure zip is installed (for Alpine)
if ! command -v zip >/dev/null 2>&1; then
    echo "📦 Installing zip..."
    apk add --no-cache zip || true
fi

# Name of the output file
OUTPUT="app-shineedu.zip"

# Remove existing zip
if [ -f "$OUTPUT" ]; then
    echo "🗑️ Removing old $OUTPUT..."
    rm "$OUTPUT"
fi

echo "📦 Bundling app-shineedu..."
echo "🚫 Excluding node_modules, .git, and development files"

# Check if .next exists
if [ ! -d ".next" ]; then
    echo "❌ Error: .next directory not found! Please run 'npm run build' first."
    exit 1
fi

# Zip everything including .next, but exclude development artifacts
zip -r "$OUTPUT" . \
    -x "node_modules/*" \
    -x ".git/*" \
    -x ".DS_Store" \
    -x "*.zip" \
    -x "bundle.sh" \
    -x ".next_bundle/*" \
    -x ".next_old/*" \
    -x "src/*" \
    -x ".gitignore" \
    -x "README.md" \
    -x "tsconfig.json" \
    -x "tailwind.config.ts" \
    -x "postcss.config.mjs" \
    -x "eslint.config.mjs"

echo "✨ Success! Zip file created: $OUTPUT"
echo "📊 File size: $(du -h $OUTPUT | cut -f1)"
