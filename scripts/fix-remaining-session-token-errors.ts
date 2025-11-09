/**
 * Fix remaining sessionToken errors:
 * 1. Files using getConvexClientFromRequest but missing sessionToken extraction
 * 2. Duplicate sessionToken declarations
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function main() {
  console.log('🔧 Fixing Remaining SessionToken Errors...\n');
  
  const apiRoutes = await glob('apps/web/app/api/**/route.ts');
  let fixedCount = 0;
  
  for (const filePath of apiRoutes) {
    try {
      let content = readFileSync(filePath, 'utf-8');
      const originalContent = content;
      let changed = false;
      
      // Fix 1: Add sessionToken extraction after getConvexClientFromRequest if missing
      const convexClientRegex = /const\s+convex\s*=\s*getConvexClientFromRequest\(request\)\s*;?/g;
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
          continue;
        }
        
        // Check if this function uses sessionToken
        const afterConvex = content.substring(insertPos, Math.min(insertPos + 500, content.length));
        if (!afterConvex.includes('sessionToken: sessionToken')) {
          continue;
        }
        
        // Add import if missing
        if (!content.includes('getSessionTokenFromRequest')) {
          const importMatch = content.match(/import\s+.*from\s+['"]@\/lib\/conxed-client['"]/);
          if (importMatch) {
            const importLine = importMatch[0];
            if (importLine.includes('getConvexClientFromRequest') && !importLine.includes('getSessionTokenFromRequest')) {
              content = content.replace(
                /import\s+({[^}]*getConvexClientFromRequest[^}]*})\s+from\s+['"]@\/lib\/conxed-client['"]/,
                "import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client'"
              );
              changed = true;
            } else if (!importLine.includes('getSessionTokenFromRequest')) {
              content = content.replace(
                /import\s+({[^}]*})\s+from\s+['"]@\/lib\/conxed-client['"]/,
                (match, imports) => {
                  return `import { ${imports}, getSessionTokenFromRequest } from '@/lib/conxed-client'`;
                }
              );
              changed = true;
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
                changed = true;
              }
            }
          }
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
        changed = true;
      }
      
      // Fix 2: Fix duplicate sessionToken declarations
      // Pattern: const { password, sessionToken, ... } = user;
      // When sessionToken is already declared above
      const duplicatePattern = /const\s+{\s*[^}]*sessionToken[^}]*}\s*=\s*\w+;/g;
      let duplicateMatch;
      while ((duplicateMatch = duplicatePattern.exec(content)) !== null) {
        const matchText = duplicateMatch[0];
        // Check if sessionToken is declared before this
        const beforeMatch = content.substring(0, duplicateMatch.index);
        if (beforeMatch.includes('const sessionToken = getSessionTokenFromRequest(request)')) {
          // Remove sessionToken from destructuring
          const newMatch = matchText.replace(/,\s*sessionToken\s*,/, ',').replace(/,\s*sessionToken\s*}/, '}').replace(/{\s*sessionToken\s*,/, '{');
          if (newMatch !== matchText) {
            content = content.substring(0, duplicateMatch.index) + newMatch + content.substring(duplicateMatch.index + matchText.length);
            changed = true;
          }
        }
      }
      
      if (changed && content !== originalContent) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${filePath}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error);
    }
  }
  
  console.log(`\n✅ Done! Fixed ${fixedCount} files.`);
}

main().catch(console.error);

