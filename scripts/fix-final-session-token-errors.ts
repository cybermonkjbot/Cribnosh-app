#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔧 Fixing Final SessionToken Errors...\n');

const filesToFix = [
  'apps/web/app/api/reviews/route.ts',
  'apps/web/app/api/staff-list/route.ts',
  'apps/web/app/api/timelogs/route.ts',
  'apps/web/app/api/webhooks/resend/route.ts',
];

let fixedCount = 0;

for (const filePath of filesToFix) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Find all functions that use getConvexClientFromRequest and sessionToken but don't extract it
    const functionMatches = content.matchAll(/async function handle(\w+)\([^)]*request[^)]*\)[^{]*\{/g);
    
    for (const match of functionMatches) {
      const functionStart = match.index!;
      const functionName = `handle${match[1]}`;
      
      // Find the closing brace for this function
      let braceCount = 0;
      let inFunction = false;
      let functionEnd = functionStart;
      
      for (let i = functionStart; i < content.length; i++) {
        if (content[i] === '{') {
          braceCount++;
          inFunction = true;
        } else if (content[i] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            functionEnd = i;
            break;
          }
        }
      }
      
      const functionBody = content.substring(functionStart, functionEnd + 1);
      
      // Check if function uses sessionToken but doesn't extract it
      if (functionBody.includes('sessionToken: sessionToken || undefined') && 
          !functionBody.includes('const sessionToken = getSessionTokenFromRequest(request)')) {
        
        // Find where to insert sessionToken extraction
        const convexMatch = functionBody.match(/const convex = getConvexClientFromRequest\(request\);/);
        
        if (convexMatch) {
          const insertPos = functionStart + convexMatch.index! + convexMatch[0].length;
          const before = content.substring(0, insertPos);
          const after = content.substring(insertPos);
          
          content = before + '\n    const sessionToken = getSessionTokenFromRequest(request);' + after;
          modified = true;
        }
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

