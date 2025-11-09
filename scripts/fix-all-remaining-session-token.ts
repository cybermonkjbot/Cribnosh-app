/**
 * Fix ALL remaining sessionToken errors by finding files that use sessionToken but don't extract it
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function main() {
  console.log('🔧 Fixing ALL Remaining SessionToken Errors...\n');
  
  const apiRoutes = await glob('apps/web/app/api/**/route.ts');
  let fixedCount = 0;
  
  for (const filePath of apiRoutes) {
    try {
      let content = readFileSync(filePath, 'utf-8');
      const originalContent = content;
      let changed = false;
      
      // Check if file uses sessionToken but doesn't have extraction
      const usesSessionToken = content.includes('sessionToken: sessionToken') || 
                               content.includes('sessionToken: sessionToken || undefined');
      const hasExtraction = content.includes('const sessionToken = getSessionTokenFromRequest');
      
      if (!usesSessionToken || hasExtraction) {
        continue;
      }
      
      // Find all places where sessionToken is used but not defined
      // Pattern: sessionToken: sessionToken || undefined
      const sessionTokenUsageRegex = /sessionToken:\s*sessionToken\s*\|\|\s*undefined/g;
      const matches: Array<{ index: number }> = [];
      let match;
      
      while ((match = sessionTokenUsageRegex.exec(content)) !== null) {
        matches.push({ index: match.index });
      }
      
      if (matches.length === 0) {
        continue;
      }
      
      // Find the function that contains the first usage
      const firstUsage = matches[0].index;
      const beforeUsage = content.substring(0, firstUsage);
      
      // Find the function signature - could be async function, function, or arrow function
      const functionMatch = beforeUsage.match(/(?:async\s+)?(?:function\s+\w+|export\s+async\s+function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(?)\s*\([^)]*\)/g);
      if (!functionMatch || functionMatch.length === 0) {
        continue;
      }
      
      // Get the last function match (closest to the usage)
      const lastFunction = functionMatch[functionMatch.length - 1];
      const functionIndex = beforeUsage.lastIndexOf(lastFunction);
      
      // Extract parameter name (could be request, req, etc.)
      const paramMatch = lastFunction.match(/\(([^)]+)\)/);
      if (!paramMatch) {
        continue;
      }
      
      const params = paramMatch[1];
      // Find request-like parameter
      const requestParamMatch = params.match(/(\w+)\s*:\s*(?:NextRequest|Request)/);
      if (!requestParamMatch) {
        // Try to find any parameter that might be the request
        const anyParamMatch = params.match(/(\w+)/);
        if (!anyParamMatch) {
          continue;
        }
        // Use the first parameter as request
        var requestParamName = anyParamMatch[1];
      } else {
        var requestParamName = requestParamMatch[1];
      }
      
      // Find where to insert sessionToken extraction
      // Look for getConvexClient or getConvexClientFromRequest calls
      const convexCallMatch = beforeUsage.match(/(?:const\s+convex\s*=\s*(?:getConvexClient|getConvexClientFromRequest)\([^)]*\)|const\s+{\s*getConvexClient[^}]*}\s*=\s*await\s+import\([^)]+\))/);
      if (!convexCallMatch) {
        continue;
      }
      
      const convexCallIndex = beforeUsage.lastIndexOf(convexCallMatch[0]);
      const convexCallEnd = convexCallIndex + convexCallMatch[0].length;
      
      // Check if sessionToken extraction already exists after this
      const afterConvexCall = content.substring(convexCallEnd, Math.min(convexCallEnd + 200, firstUsage));
      if (afterConvexCall.includes('const sessionToken = getSessionTokenFromRequest')) {
        continue;
      }
      
      // Add import if missing
      if (!content.includes('getSessionTokenFromRequest')) {
        // Check for dynamic import
        const dynamicImportMatch = content.match(/const\s+{\s*getConvexClient[^}]*}\s*=\s*await\s+import\(['"]@\/lib\/conxed-client['"]\)/);
        if (dynamicImportMatch) {
          // Add to dynamic import
          content = content.replace(
            /const\s+{\s*getConvexClient([^}]*)}\s*=\s*await\s+import\(['"]@\/lib\/conxed-client['"]\)/,
            (match, imports) => {
              if (imports.includes('getSessionTokenFromRequest')) {
                return match;
              }
              return `const { getConvexClient${imports}, getSessionTokenFromRequest } = await import('@/lib/conxed-client')`;
            }
          );
          changed = true;
        } else {
          // Add regular import
          const importMatch = content.match(/import\s+.*from\s+['"]@\/lib\/conxed-client['"]/);
          if (importMatch) {
            const importLine = importMatch[0];
            if (!importLine.includes('getSessionTokenFromRequest')) {
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
      }
      
      // Add sessionToken extraction after convex call
      const lineStart = content.lastIndexOf('\n', convexCallEnd) + 1;
      const lineBeforeConvex = content.substring(lineStart, convexCallEnd);
      const indent = lineBeforeConvex.match(/^\s*/)?.[0] || '    ';
      
      // Check if there's a semicolon
      const needsSemicolon = !content.substring(convexCallEnd, convexCallEnd + 1).trim().startsWith(';');
      const semicolon = needsSemicolon ? ';' : '';
      
      content = content.slice(0, convexCallEnd) +
        `${semicolon}\n${indent}const sessionToken = getSessionTokenFromRequest(${requestParamName});` +
        content.slice(convexCallEnd);
      changed = true;
      
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

