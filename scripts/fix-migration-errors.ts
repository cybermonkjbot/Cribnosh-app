#!/usr/bin/env tsx
/**
 * Fix Migration Errors Script
 * 
 * This script fixes errors introduced by the migration script:
 * 1. Fixes broken export statements in client components
 * 2. Adds missing sessionToken extraction in API routes with multiple handlers
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Files with known errors - will be auto-detected
const BROKEN_FILES: string[] = [];

function fixBrokenExport(filePath: string, content: string): string {
  // Fix broken export statements like: export defau  const sessionToken = useSessionToken(); lt function
  const brokenExportRegex = /export\s+defau\s+const\s+sessionToken\s*=\s*useSessionToken\(\);\s*lt\s+function\s+(\w+)/;
  let fixed = content.replace(brokenExportRegex, (match, functionName) => {
    return `export default function ${functionName}`;
  });
  
  // Fix broken export statements like: export default function Name()   const sessionToken = useSessionToken(); {
  const brokenExport2Regex = /export\s+default\s+function\s+(\w+)\s*\([^)]*\)\s+const\s+sessionToken\s*=\s*useSessionToken\(\);\s*\{/;
  fixed = fixed.replace(brokenExport2Regex, (match, functionName) => {
    return `export default function ${functionName}() {`;
  });
  
  // Now add the hook call in the right place if it's missing
  if (fixed !== content) {
    const funcMatch = fixed.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/);
    if (funcMatch) {
      const funcStart = funcMatch.index! + funcMatch[0].length;
      const afterFunc = fixed.substring(funcStart);
      
      // Check if sessionToken hook is already there
      if (!afterFunc.match(/\s+const\s+sessionToken\s*=\s*useSessionToken\(\)/)) {
        const hookMatch = afterFunc.match(/(\s+const\s+\w+\s*=\s*(use\w+|useState|useEffect))/);
        
        if (hookMatch) {
          const insertPos = funcStart + hookMatch.index!;
          const indent = hookMatch[1].match(/^\s*/)?.[0] || '  ';
          fixed = fixed.slice(0, insertPos) +
            `${indent}const sessionToken = useSessionToken();\n` +
            fixed.slice(insertPos);
        } else {
          const lineStart = fixed.lastIndexOf('\n', funcStart - 1) + 1;
          const lineBeforeFunc = fixed.substring(lineStart, funcStart - funcMatch[0].length);
          const baseIndent = lineBeforeFunc.match(/^\s*/)?.[0] || '';
          const indent = baseIndent + '  ';
          fixed = fixed.slice(0, funcStart) +
            `\n${indent}const sessionToken = useSessionToken();` +
            fixed.slice(funcStart);
        }
      }
    }
  }
  
  return fixed;
}

function fixMissingSessionToken(filePath: string, content: string): string {
  // Find all getConvexClientFromRequest calls that don't have sessionToken extraction after them
  const convexRegex = /const\s+convex\s*=\s*getConvexClientFromRequest\(request\)\s*;?/g;
  const convexMatches: Array<{ index: number; match: string }> = [];
  let match;
  
  // Find all matches
  while ((match = convexRegex.exec(content)) !== null) {
    convexMatches.push({ index: match.index, match: match[0] });
  }
  
  // Process in reverse to preserve indices
  for (let i = convexMatches.length - 1; i >= 0; i--) {
    const convexMatch = convexMatches[i];
    const insertPos = convexMatch.index + convexMatch.match.length;
    
    // Check if sessionToken extraction already exists right after this (within 200 chars)
    const afterMatch = content.slice(insertPos, insertPos + 200);
    if (afterMatch.includes('const sessionToken = getSessionTokenFromRequest(request)')) {
      continue; // Already has sessionToken extraction
    }
    
    // Check if sessionToken is used anywhere after this convex call (within reasonable distance)
    // Look for sessionToken usage in queries/mutations
    const afterConvex = content.slice(insertPos, insertPos + 500);
    if (afterConvex.includes('sessionToken:') || afterConvex.includes('sessionToken ||')) {
      // sessionToken is used, so we need to add extraction
      // Determine indentation
      const lineStart = content.lastIndexOf('\n', convexMatch.index) + 1;
      const lineBeforeConvex = content.substring(lineStart, convexMatch.index);
      const indent = lineBeforeConvex.match(/^\s*/)?.[0] || '    ';
      
      const needsSemicolon = !convexMatch.match.endsWith(';');
      
      content = content.slice(0, insertPos) +
        (needsSemicolon ? ';' : '') +
        `\n${indent}const sessionToken = getSessionTokenFromRequest(request);` +
        content.slice(insertPos);
    }
  }
  
  return content;
}

async function main() {
  console.log('🔧 Fixing Migration Errors...\n');
  
  // Auto-detect broken files by scanning for common error patterns
  const apiRoutes = await glob('apps/web/app/api/**/route.ts');
  const clientComponents = await glob('apps/web/app/**/*.{tsx,ts}');
  const allFiles = [...apiRoutes, ...clientComponents];
  
  const brokenFiles: string[] = [];
  
  // Find files with broken exports
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      // Check for broken export statements
      if (content.match(/export\s+defau\s+const\s+sessionToken/) || 
          content.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s+const\s+sessionToken/)) {
        brokenFiles.push(file);
      }
      
      // Check for useQuery inside object literals
      if (content.match(/['"]?\w+['"]?\s*:\s*[^,}]*useQuery\(/)) {
        brokenFiles.push(file);
      }
      
      // Check for sessionToken in type annotations
      if (content.match(/:\s*\{[^}]*sessionToken\s*:\s*sessionToken/)) {
        brokenFiles.push(file);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Add known broken files
  const knownBroken = [
    'apps/web/app/staff/time-tracking/page.tsx',
    'apps/web/app/admin/account/page.tsx',
    'apps/web/app/admin/cities/page.tsx',
    'apps/web/app/admin/content/blog/page.tsx',
    'apps/web/app/admin/page.tsx',
    'apps/web/app/admin/staff/work-ids/page.tsx',
    'apps/web/app/api/admin/dishes/[dish_id]/route.ts',
    'apps/web/app/api/auth/register/customer/route.ts',
    'apps/web/app/api/chat/conversations/[chat_id]/upload/route.ts',
    'apps/web/app/driving/apply/page.tsx',
    'apps/web/app/staff/documents/page.tsx',
  ];
  
  const allBrokenFiles = [...new Set([...brokenFiles, ...knownBroken])];
  
  console.log(`Found ${allBrokenFiles.length} files to fix\n`);
  
  for (const filePath of allBrokenFiles) {
    try {
      let content = readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Fix broken exports
      content = fixBrokenExport(filePath, content);
      
      // Fix missing sessionToken
      content = fixMissingSessionToken(filePath, content);
      
      // Fix useQuery inside object literals
      content = content.replace(/(['"]?\w+['"]?\s*:\s*[^,}]*?)useQuery\(([^,}]+),\s*([^}]+)\)/g, (match, before, query, args) => {
        // Remove the incorrectly added sessionToken from object literal
        return before + `useQuery(${query}, ${args.replace(/sessionToken\s*:\s*sessionToken\s*\|\|\s*undefined[,\s]*/, '')})`;
      });
      
      // Fix sessionToken in type annotations
      content = content.replace(/:\s*\{([^}]*?)sessionToken\s*:\s*sessionToken\s*\|\|\s*undefined([^}]*?)\}/g, (match, before, after) => {
        return `: {${before}${after}}`;
      });
      
      // Fix broken useQuery calls in object literals
      content = content.replace(/(['"]?\w+['"]?\s*:\s*)(const\s+sessionToken\s*=\s*useSessionToken\(\);)\s*([^,}]+)/g, (match, prop, hook, rest) => {
        return prop + rest;
      });
      
      if (content !== originalContent) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${filePath}`);
      } else {
        console.log(`⏭️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error);
    }
  }
  
  console.log('\n✅ Done!');
}

main().catch(console.error);

