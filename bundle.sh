#!/bin/bash

# Name of the output file
OUTPUT="app-shineedu.zip"

# Remove existing zip if it exists to avoid adding new files into an old archive
if [ -f "$OUTPUT" ]; then
    echo "🗑️ Removing old $OUTPUT..."
    rm "$OUTPUT"
fi

echo "📦 Bundling app-shineedu..."
echo "🚀 Including .next build folder"
echo "🚫 Excluding node_modules, .git, and DS_Store"

# Zip the current directory
# -r: recursive
# -x: exclude patterns
# We also exclude the zip itself and the script to avoid recursion or bloating
zip -r "$OUTPUT" . -x "node_modules/*" ".git/*" ".DS_Store" "*.zip" "bundle.sh"

echo "✨ Success! Zip file created: $OUTPUT"
