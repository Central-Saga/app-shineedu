#!/bin/sh

# Ensure zip is installed (for Alpine)
if ! command -v zip >/dev/null 2>&1; then
    echo "📦 Installing zip..."
    apk add --no-cache zip || true
fi

# Name of the output file
OUTPUT="app-shineedu.zip"
BUILD_DIR=${1:-.next}

# Remove existing zip
if [ -f "$OUTPUT" ]; then
    echo "🗑️ Removing old $OUTPUT..."
    rm "$OUTPUT"
fi

echo "📦 Bundling app-shineedu..."
echo "🚀 Using build folder: $BUILD_DIR (will be named .next in zip)"
echo "🚫 Excluding node_modules, .git, and DS_Store"

# 1. Zip everything EXCEPT any .next folders and node_modules
zip -r "$OUTPUT" . -x "node_modules/*" ".git/*" ".DS_Store" "*.zip" "bundle.sh" ".next/*" ".next_bundle/*" ".next_old/*"

# 2. Add the build directory to the zip, but rename it to .next
if [ -d "$BUILD_DIR" ]; then
    echo "📁 Packaging $BUILD_DIR as .next..."
    mkdir -p .temp_zip_stage
    cp -rp "$BUILD_DIR" .temp_zip_stage/.next
    cd .temp_zip_stage
    zip -rg "../$OUTPUT" .next
    cd ..
    rm -rf .temp_zip_stage
else
    echo "⚠️ Warning: Build directory $BUILD_DIR not found!"
fi

echo "✨ Success! Zip file created: $OUTPUT"
