#!/bin/bash
# Script to help identify and fix ConvexHttpClient usage in API routes
# This script finds files that need to be updated

echo "Finding files that use ConvexHttpClient or getConvexClient in API routes..."
echo ""

# Find files with ConvexHttpClient from convex/browser
echo "Files using ConvexHttpClient from convex/browser:"
find apps/web/app/api -name "*.ts" -o -name "*.tsx" | xargs grep -l "ConvexHttpClient.*from.*convex/browser" 2>/dev/null | head -10

echo ""
echo "Files using getConvexClient:"
find apps/web/app/api -name "*.ts" -o -name "*.tsx" | xargs grep -l "getConvexClient()" 2>/dev/null | head -10

echo ""
echo "Files using getConvexClientFromRequest:"
find apps/web/app/api -name "*.ts" -o -name "*.tsx" | xargs grep -l "getConvexClientFromRequest" 2>/dev/null | head -10

echo ""
echo "Total files to fix:"
find apps/web/app/api -name "*.ts" -o -name "*.tsx" | xargs grep -l "getConvexClient\|getConvexClientFromRequest\|ConvexHttpClient.*from.*convex/browser" 2>/dev/null | wc -l

