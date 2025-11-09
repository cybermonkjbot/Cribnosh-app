#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Fixing ALL Remaining SessionToken Errors...\n');

// Get all files with "Cannot find name 'sessionToken'" errors
const files = [
  { path: 'apps/web/app/api/reviews/route.ts', param: 'request' },
  { path: 'apps/web/app/api/staff-list/route.ts', param: 'request' },
  { path: 'apps/web/app/api/timelogs/route.ts', param: 'req' },
  { path: 'apps/web/app/api/webhooks/resend/route.ts', param: 'request' },
];

let fixedCount = 0;

for (const { path: filePath, param } of files) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Pattern 1: Find const convex = getConvexClientFromRequest OR getConvexClient that uses sessionToken
    const convexRegex = /const convex = getConvex(?:ClientFromRequest\([^)]+\)|Client\(\));/g;
    
    let match;
    while ((match = convexRegex.exec(content)) !== null) {
      const convexLine = match[0];
      const convexPos = match.index;
      
      // Look ahead to see if sessionToken is used but not declared in this function
      const afterConvex = content.substring(convexPos);
      const nextFunctionPos = afterConvex.search(/\nasync function|export async function|export function/);
      const scopeEnd = nextFunctionPos > 0 ? convexPos + nextFunctionPos : content.length;
      const functionScope = content.substring(convexPos, scopeEnd);
      
      // Check if sessionToken is used but not extracted
      if (functionScope.includes('sessionToken: sessionToken || undefined') &&
          !functionScope.includes('const sessionToken = getSessionTokenFromRequest(')) {
        
        // Insert sessionToken extraction after convex line
        const insertPos = convexPos + convexLine.length;
        const before = content.substring(0, insertPos);
        const after = content.substring(insertPos);
        
        content = before + `\n    const sessionToken = getSessionTokenFromRequest(${param});` + after;
        modified = true;
        
        // Reset regex since we modified the content
        convexRegex.lastIndex = 0;
        break;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Fixed: ${filePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.log(`⚠️  Error processing ${filePath}:`, error);
  }
}

console.log(`\n✅ Done! Fixed ${fixedCount} files.`);

