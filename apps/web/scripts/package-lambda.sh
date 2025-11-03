#!/bin/bash

# Script to package the keep-alive Lambda function
# This script creates a deployment package for the Lambda function

set -e

echo "📦 Packaging keep-alive Lambda function..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Copy the Lambda function code
cp /Users/joshua/Documents/cribland-1/scripts/keep-alive-lambda.ts ./index.ts

# Install dependencies
echo "📥 Installing dependencies..."
npm init -y
npm install --production

# Compile TypeScript (if needed)
if command -v tsc &> /dev/null; then
    echo "🔨 Compiling TypeScript..."
    npx tsc index.ts --target es2020 --module commonjs --outDir .
else
    echo "⚠️  TypeScript compiler not found, using JavaScript directly"
    mv index.ts index.js
fi

# Create deployment package
echo "📦 Creating deployment package..."
zip -r keep_alive.zip . -x "*.ts" "*.map" "node_modules/.cache/*"

# Copy to project directory
cp keep_alive.zip /Users/joshua/Documents/cribland-1/

# Cleanup
cd /Users/joshua/Documents/cribland-1
rm -rf "$TEMP_DIR"

echo "✅ Keep-alive Lambda package created: keep_alive.zip"
echo "🚀 Ready for Terraform deployment"