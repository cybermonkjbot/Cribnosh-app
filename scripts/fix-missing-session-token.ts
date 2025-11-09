/**
 * Fix files that have getConvexClient() calls but are missing sessionToken extraction
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function main() {
  console.log('🔧 Fixing Missing SessionToken Extraction...\n');
  
  const apiRoutes = await glob('apps/web/app/api/**/route.ts');
  let fixedCount = 0;
  
  for (const filePath of apiRoutes) {
    try {
      let content = readFileSync(filePath, 'utf-8');
      const originalContent = content;
      
      // Check if file uses getConvexClient() and has request parameter
      if (!content.includes('getConvexClient()')) {
        continue;
      }
      
      // Check if file already has sessionToken extraction
      if (content.includes('const sessionToken = getSessionTokenFromRequest(request)')) {
        continue;
      }
      
      // Check if file has request parameter in function signatures
      if (!content.match(/(?:async\s+)?function\s+\w+\s*\([^)]*request[^)]*\)/)) {
        continue;
      }
      
      // Check if file uses sessionToken in queries/mutations but doesn't have extraction
      // OR if file has getConvexClient() calls and uses sessionToken but doesn't extract it
      const usesSessionToken = content.includes('sessionToken: sessionToken || undefined') || 
                               content.includes('sessionToken: sessionToken');
      const hasExtraction = content.includes('const sessionToken = getSessionTokenFromRequest(request)');
      
      if (usesSessionToken && !hasExtraction) {
        
        // Add import if missing
        if (!content.includes('getSessionTokenFromRequest')) {
          const importMatch = content.match(/import\s+.*from\s+['"]@\/lib\/conxed-client['"]/);
          if (importMatch) {
            const importLine = importMatch[0];
            if (importLine.includes('getConvexClient') && !importLine.includes('getSessionTokenFromRequest')) {
              content = content.replace(
                /import\s+({[^}]*getConvexClient[^}]*})\s+from\s+['"]@\/lib\/conxed-client['"]/,
                "import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client'"
              );
            } else if (!importLine.includes('getSessionTokenFromRequest')) {
              content = content.replace(
                /import\s+({[^}]*})\s+from\s+['"]@\/lib\/conxed-client['"]/,
                (match, imports) => {
                  return `import { ${imports}, getSessionTokenFromRequest } from '@/lib/conxed-client'`;
                }
              );
            }
          } else {
            // Add new import
            const lastImportMatch = content.match(/^import\s+.*$/gm);
            if (lastImportMatch && lastImportMatch.length > 0) {
              const lastImport = lastImportMatch[lastImportMatch.length - 1];
              const lastImportIndex = content.lastIndexOf(lastImport);
              const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
              if (lastImportLineEnd > 0) {
                content = content.slice(0, lastImportLineEnd + 1) +
                  `import { getSessionTokenFromRequest } from '@/lib/conxed-client';\n` +
                  content.slice(lastImportLineEnd + 1);
              }
            }
          }
        }
        
        // Add sessionToken extraction after each getConvexClient() call
        const convexClientRegex = /const\s+convex\s*=\s*getConvexClient\(\)\s*;?/g;
        const matches: Array<{ index: number; match: string }> = [];
        let match;
        
        while ((match = convexClientRegex.exec(content)) !== null) {
          matches.push({ index: match.index, match: match[0] });
        }
        
        // Process in reverse to preserve indices
        for (let i = matches.length - 1; i >= 0; i--) {
          const convexMatch = matches[i];
          const insertPos = convexMatch.index + convexMatch.match.length;
          
          // Check if sessionToken extraction already exists right after this
          const afterMatch = content.slice(insertPos, insertPos + 100).trim();
          if (afterMatch.includes('const sessionToken = getSessionTokenFromRequest(request)')) {
            continue;
          }
          
          // Check if we're inside a function that has request parameter
          const beforeMatch = content.substring(Math.max(0, convexMatch.index - 500), convexMatch.index);
          const functionMatch = beforeMatch.match(/(?:async\s+)?function\s+\w+\s*\([^)]*request[^)]*\)/);
          if (!functionMatch) {
            // Not in a function with request parameter, skip
            continue;
          }
          
          // Determine indentation
          const lineStart = content.lastIndexOf('\n', convexMatch.index) + 1;
          const lineBeforeConvex = content.substring(lineStart, convexMatch.index);
          const indent = lineBeforeConvex.match(/^\s*/)?.[0] || '    ';
          
          // Add sessionToken extraction
          const needsSemicolon = !convexMatch.match.endsWith(';');
          const semicolon = needsSemicolon ? ';' : '';
          content = content.slice(0, insertPos) +
            `${semicolon}\n${indent}const sessionToken = getSessionTokenFromRequest(request);` +
            content.slice(insertPos);
        }
        
        if (content !== originalContent) {
          writeFileSync(filePath, content, 'utf-8');
          console.log(`✅ Fixed: ${filePath}`);
          fixedCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error);
    }
  }
  
  console.log(`\n✅ Done! Fixed ${fixedCount} files.`);
}

main().catch(console.error);

