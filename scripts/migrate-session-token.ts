#!/usr/bin/env tsx
/**
 * Automated Session Token Migration Script
 * 
 * This script automatically migrates API routes and client components
 * from JWT-based auth (setAuth) to session token-based auth.
 * 
 * Usage:
 *   bun run scripts/migrate-session-token.ts [--dry-run] [--file <path>]
 * 
 * Options:
 *   --dry-run: Show what would be changed without making changes
 *   --file: Only process a specific file
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface MigrationResult {
  file: string;
  changes: string[];
  errors: string[];
  skipped: boolean;
  reason?: string;
}

const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];

// Files that should be skipped (webhooks, public endpoints, etc.)
const SKIP_FILES = [
  'webhooks/stripe',
  'stripe/webhook',
  'health/route', // Special case - needs manual fix
];

// Files that are already updated
const ALREADY_UPDATED = [
  'api/staff/data/route.ts',
  'api/staff/notices/route.ts',
  'api/orders/ready/route.ts',
  'api/chat/messages/route.ts',
  'app/staff/layout.tsx',
  'app/staff/portal/page.tsx',
  'app/staff/onboarding/page.tsx',
];

function shouldSkipFile(filePath: string): boolean {
  // Skip if already updated
  if (ALREADY_UPDATED.some(updated => filePath.includes(updated))) {
    return true;
  }
  
  // Skip webhooks and public endpoints
  if (SKIP_FILES.some(skip => filePath.includes(skip))) {
    return true;
  }
  
  return false;
}

/**
 * Find matching brace position (handles nested braces)
 */
function findMatchingBrace(str: string, startPos: number): number {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = startPos; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';
    
    // Handle string literals
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    }
    
    if (inString) continue;
    
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Migrate an API route file
 */
function migrateApiRoute(filePath: string, content: string): { newContent: string; changes: string[] } {
  const changes: string[] = [];
  let newContent = content;
  
  // Check if file already has sessionToken in all places
  const hasSessionTokenImport = content.includes('getSessionTokenFromRequest');
  const hasSessionTokenVar = /const\s+sessionToken\s*=\s*getSessionTokenFromRequest\(request\)/.test(content);
  
  // Check all query/mutation calls
  let allQueriesHaveToken = true;
  let allMutationsHaveToken = true;
  
  // Find all convex.query calls
  const queryMatches: Array<{ start: number; end: number; hasToken: boolean }> = [];
  let queryIndex = 0;
  while ((queryIndex = content.indexOf('convex.query(', queryIndex)) !== -1) {
    const openBrace = content.indexOf('{', queryIndex);
    if (openBrace === -1) {
      queryIndex++;
      continue;
    }
    const closeBrace = findMatchingBrace(content, openBrace);
    if (closeBrace === -1) {
      queryIndex++;
      continue;
    }
    const args = content.substring(openBrace, closeBrace + 1);
    queryMatches.push({
      start: queryIndex,
      end: closeBrace + 1,
      hasToken: args.includes('sessionToken')
    });
    if (!args.includes('sessionToken')) {
      allQueriesHaveToken = false;
    }
    queryIndex = closeBrace + 1;
  }
  
  // Find all convex.mutation calls
  const mutationMatches: Array<{ start: number; end: number; hasToken: boolean }> = [];
  let mutationIndex = 0;
  while ((mutationIndex = content.indexOf('convex.mutation(', mutationIndex)) !== -1) {
    const openBrace = content.indexOf('{', mutationIndex);
    if (openBrace === -1) {
      mutationIndex++;
      continue;
    }
    const closeBrace = findMatchingBrace(content, openBrace);
    if (closeBrace === -1) {
      mutationIndex++;
      continue;
    }
    const args = content.substring(openBrace, closeBrace + 1);
    mutationMatches.push({
      start: mutationIndex,
      end: closeBrace + 1,
      hasToken: args.includes('sessionToken')
    });
    if (!args.includes('sessionToken')) {
      allMutationsHaveToken = false;
    }
    mutationIndex = closeBrace + 1;
  }
  
  // If everything already has sessionToken, skip
  if (hasSessionTokenImport && hasSessionTokenVar && allQueriesHaveToken && allMutationsHaveToken) {
    return { newContent: content, changes: ['Already has sessionToken in all queries/mutations'] };
  }
  
  // Step 1: Add import if not present
  if (!hasSessionTokenImport) {
    // Try to find existing import from conxed-client
    const importRegex = /import\s+([^'"]*)\s+from\s+['"]@\/lib\/conxed-client['"]/;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const existingImport = importMatch[0];
      const importSpec = importMatch[1].trim();
      
      // Check if it's a named import
      if (importSpec.startsWith('{') && importSpec.endsWith('}')) {
        // Add to existing named import
        const imports = importSpec.slice(1, -1).split(',').map(i => i.trim());
        if (!imports.includes('getSessionTokenFromRequest')) {
          imports.push('getSessionTokenFromRequest');
          const newImport = `import { ${imports.join(', ')} } from '@/lib/conxed-client';`;
          // Find the exact import line in newContent (it might have been modified)
          // Match the import statement, optionally followed by semicolon and whitespace
          const importLineRegex = /import\s+[^'"]*\s+from\s+['"]@\/lib\/conxed-client['"]\s*;?\s*/;
          const importLineMatch = newContent.match(importLineRegex);
          if (importLineMatch) {
            // Replace the matched import line with the new import (which includes semicolon)
            // Preserve any newline that follows
            const matchedLine = importLineMatch[0];
            const hasNewline = matchedLine.endsWith('\n');
            const replacement = newImport + (hasNewline ? '\n' : '');
            newContent = newContent.replace(matchedLine, replacement);
          } else {
            // Fallback: replace the existing import we found
            // Remove any trailing semicolons from existing import to avoid double semicolons
            const cleanExisting = existingImport.replace(/;+\s*$/, '');
            newContent = newContent.replace(cleanExisting, newImport);
          }
          changes.push('Added getSessionTokenFromRequest to existing import');
        }
      } else {
        // Add new import line after existing one
        const importLineEnd = content.indexOf('\n', importMatch.index!);
        if (importLineEnd > 0) {
          newContent = newContent.slice(0, importLineEnd + 1) +
            `import { getSessionTokenFromRequest } from '@/lib/conxed-client';\n` +
            newContent.slice(importLineEnd + 1);
          changes.push('Added getSessionTokenFromRequest import');
        }
      }
    } else {
      // Find last import statement
      const lastImportMatch = content.match(/^import\s+.*$/gm);
      if (lastImportMatch && lastImportMatch.length > 0) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
        if (lastImportLineEnd > 0) {
          newContent = newContent.slice(0, lastImportLineEnd + 1) +
            `import { getSessionTokenFromRequest } from '@/lib/conxed-client';\n` +
            newContent.slice(lastImportLineEnd + 1);
          changes.push('Added getSessionTokenFromRequest import');
        }
      }
    }
  }
  
  // Step 2: Extract sessionToken from request in ALL handler functions
  // Find all occurrences of getConvexClientFromRequest and getConvexClient and add sessionToken extraction after each
  const convexClientRegex1 = /const\s+convex\s*=\s*getConvexClientFromRequest\(request\)\s*;?/g;
  const convexClientRegex2 = /const\s+convex\s*=\s*getConvexClient\(\)\s*;?/g;
  const convexClientMatches: Array<{ index: number; match: string; hasRequest: boolean }> = [];
  let match;
  
  // Find all matches for getConvexClientFromRequest
  while ((match = convexClientRegex1.exec(newContent)) !== null) {
    convexClientMatches.push({ index: match.index, match: match[0], hasRequest: true });
  }
  
  // Find all matches for getConvexClient (only if function has request parameter)
  while ((match = convexClientRegex2.exec(newContent)) !== null) {
    // Check if the function has a request parameter
    const beforeMatch = newContent.substring(Math.max(0, match.index - 200), match.index);
    const functionMatch = beforeMatch.match(/(?:async\s+)?function\s+\w+\s*\([^)]*request[^)]*\)/);
    if (functionMatch) {
      convexClientMatches.push({ index: match.index, match: match[0], hasRequest: true });
    }
  }
  
  // Process in reverse to preserve indices
  for (let i = convexClientMatches.length - 1; i >= 0; i--) {
    const convexClientMatch = convexClientMatches[i];
    const insertPos = convexClientMatch.index + convexClientMatch.match.length;
    
    // Check if sessionToken extraction already exists right after this
    const afterMatch = newContent.slice(insertPos, insertPos + 100).trim();
    if (afterMatch.includes('const sessionToken = getSessionTokenFromRequest(request)')) {
      continue; // Already has sessionToken extraction
    }
    
    // Check if there's already a semicolon
    const needsSemicolon = !convexClientMatch.match.endsWith(';');
    
    // Determine indentation by looking at the line the convex client is on
    const lineStart = newContent.lastIndexOf('\n', convexClientMatch.index) + 1;
    const lineBeforeConvex = newContent.substring(lineStart, convexClientMatch.index);
    const indent = lineBeforeConvex.match(/^\s*/)?.[0] || '    ';
    
    newContent = newContent.slice(0, insertPos) +
      (needsSemicolon ? ';' : '') +
      `\n${indent}const sessionToken = getSessionTokenFromRequest(request);` +
      newContent.slice(insertPos);
    changes.push('Added sessionToken extraction');
  }
  
  // Step 3: Update all convex.query() calls (process in reverse to preserve indices)
  // Recalculate positions in newContent after import/sessionToken changes
  const queryMatchesInNewContent: Array<{ start: number; end: number; hasToken: boolean }> = [];
  let queryIndexNew = 0;
  while ((queryIndexNew = newContent.indexOf('convex.query(', queryIndexNew)) !== -1) {
    // Find the comma after the first argument (the query function)
    const openParen = queryIndexNew + 'convex.query('.length;
    let commaPos = newContent.indexOf(',', openParen);
    if (commaPos === -1) {
      // No second argument, skip
      queryIndexNew++;
      continue;
    }
    
    // Find the opening brace of the arguments object (should be after the comma)
    const openBrace = newContent.indexOf('{', commaPos);
    if (openBrace === -1 || openBrace > commaPos + 50) {
      // No brace found or too far away (might be a different construct)
      queryIndexNew++;
      continue;
    }
    
    const closeBrace = findMatchingBrace(newContent, openBrace);
    if (closeBrace === -1) {
      queryIndexNew++;
      continue;
    }
    
    // Verify this is actually a query call by checking for api.queries or similar patterns
    const beforeComma = newContent.substring(openParen, commaPos);
    
    // Skip if it's inside a type annotation (e.g., `d: { _id: Id<'meals'> }`)
    const beforeQuery = newContent.substring(Math.max(0, queryIndexNew - 100), queryIndexNew);
    if (beforeQuery.match(/:\s*\{[^}]*$/)) {
      queryIndexNew++;
      continue;
    }
    
    if (!beforeComma.includes('api.queries') && !beforeComma.includes('Query') && !beforeComma.includes('query')) {
      // Might be a false positive, skip
      queryIndexNew++;
      continue;
    }
    
    const args = newContent.substring(openBrace, closeBrace + 1);
    queryMatchesInNewContent.push({
      start: queryIndexNew,
      end: closeBrace + 1,
      hasToken: args.includes('sessionToken')
    });
    queryIndexNew = closeBrace + 1;
  }
  
  for (let i = queryMatchesInNewContent.length - 1; i >= 0; i--) {
    const match = queryMatchesInNewContent[i];
    if (match.hasToken) continue;
    
    const callStart = match.start;
    const callEnd = match.end;
    const callText = newContent.substring(callStart, callEnd);
    
    // Find the opening brace of the arguments object
    const openBrace = callText.indexOf('{');
    const closeBrace = findMatchingBrace(callText, openBrace);
    
    if (openBrace === -1 || closeBrace === -1) continue;
    
    const argsText = callText.substring(openBrace + 1, closeBrace);
    const trimmedArgs = argsText.trim();
    
    // Determine indentation - preserve original formatting
    const lines = argsText.split('\n');
    let indent = '    '; // default
    let closingIndent = '  '; // default
    
    // Calculate base indentation from the line the query call is on
    const lineStart = newContent.lastIndexOf('\n', callStart) + 1;
    const lineBeforeQuery = newContent.substring(lineStart, callStart);
    const baseIndent = lineBeforeQuery.match(/^\s*/)?.[0] || '';
    
    if (lines.length > 1) {
      // Multi-line - use existing indentation
      const firstLineWithContent = lines.find(line => line.trim().length > 0);
      if (firstLineWithContent) {
        indent = firstLineWithContent.match(/^\s*/)?.[0] || '    ';
      }
      // Closing brace indentation is typically 2 spaces less
      closingIndent = indent.slice(0, Math.max(0, indent.length - 2));
    } else {
      // Single line - convert to multi-line, use base indent + 2 spaces
      indent = baseIndent + '  ';
      closingIndent = baseIndent;
    }
    
    // Add sessionToken - preserve original formatting
    let newArgs: string;
    if (lines.length > 1) {
      // Multi-line: add to end before closing brace
      const lastLine = lines[lines.length - 1];
      const hasTrailingComma = trimmedArgs.endsWith(',') || lastLine.trim().endsWith(',');
      newArgs = hasTrailingComma
        ? argsText.trimEnd().replace(/,\s*$/, '') + `,\n${indent}sessionToken: sessionToken || undefined`
        : argsText.trimEnd() + `,\n${indent}sessionToken: sessionToken || undefined`;
    } else {
      // Single line: convert to multi-line with proper formatting
      if (trimmedArgs) {
        // Parse the single-line arguments and format them properly
        const argsList = trimmedArgs.split(',').map(arg => arg.trim()).filter(arg => arg.length > 0);
        const formattedArgs = argsList.map(arg => `${indent}${arg}`).join(',\n');
        newArgs = `\n${formattedArgs},\n${indent}sessionToken: sessionToken || undefined`;
      } else {
        newArgs = `\n${indent}sessionToken: sessionToken || undefined`;
      }
    }
    
    const newCallText = callText.substring(0, openBrace + 1) + newArgs + '\n' + closingIndent + callText.substring(closeBrace);
    newContent = newContent.substring(0, callStart) + newCallText + newContent.substring(callEnd);
    
    // Extract query name for logging
    const queryNameMatch = callText.match(/api\.queries\.([^\s,]+)/);
    changes.push(`Added sessionToken to query: ${queryNameMatch ? queryNameMatch[1] : 'unknown'}`);
  }
  
  // Step 4: Update all convex.mutation() calls (process in reverse)
  // Recalculate positions in newContent after import/sessionToken changes
  const mutationMatchesInNewContent: Array<{ start: number; end: number; hasToken: boolean }> = [];
  let mutationIndexNew = 0;
  while ((mutationIndexNew = newContent.indexOf('convex.mutation(', mutationIndexNew)) !== -1) {
    // Find the comma after the first argument (the mutation function)
    const openParen = mutationIndexNew + 'convex.mutation('.length;
    let commaPos = newContent.indexOf(',', openParen);
    if (commaPos === -1) {
      // No second argument, skip
      mutationIndexNew++;
      continue;
    }
    
    // Find the opening brace of the arguments object (should be after the comma)
    const openBrace = newContent.indexOf('{', commaPos);
    if (openBrace === -1 || openBrace > commaPos + 50) {
      // No brace found or too far away (might be a different construct)
      mutationIndexNew++;
      continue;
    }
    
    const closeBrace = findMatchingBrace(newContent, openBrace);
    if (closeBrace === -1) {
      mutationIndexNew++;
      continue;
    }
    
    // Verify this is actually a mutation call by checking for api.mutations or similar patterns
    const beforeComma = newContent.substring(openParen, commaPos);
    
    // Skip if it's inside a type annotation
    const beforeMutation = newContent.substring(Math.max(0, mutationIndexNew - 100), mutationIndexNew);
    if (beforeMutation.match(/:\s*\{[^}]*$/)) {
      mutationIndexNew++;
      continue;
    }
    
    if (!beforeComma.includes('api.mutations') && !beforeComma.includes('Mutation') && !beforeComma.includes('mutation')) {
      // Might be a false positive, skip
      mutationIndexNew++;
      continue;
    }
    
    const args = newContent.substring(openBrace, closeBrace + 1);
    mutationMatchesInNewContent.push({
      start: mutationIndexNew,
      end: closeBrace + 1,
      hasToken: args.includes('sessionToken')
    });
    mutationIndexNew = closeBrace + 1;
  }
  
  for (let i = mutationMatchesInNewContent.length - 1; i >= 0; i--) {
    const match = mutationMatchesInNewContent[i];
    if (match.hasToken) continue;
    
    const callStart = match.start;
    const callEnd = match.end;
    const callText = newContent.substring(callStart, callEnd);
    
    // Find the opening brace of the arguments object
    const openBrace = callText.indexOf('{');
    const closeBrace = findMatchingBrace(callText, openBrace);
    
    if (openBrace === -1 || closeBrace === -1) continue;
    
    const argsText = callText.substring(openBrace + 1, closeBrace);
    const trimmedArgs = argsText.trim();
    
    // Determine indentation - preserve original formatting
    const lines = argsText.split('\n');
    let indent = '    '; // default
    let closingIndent = '  '; // default
    
    // Calculate base indentation from the line the query call is on
    const lineStart = newContent.lastIndexOf('\n', callStart) + 1;
    const lineBeforeQuery = newContent.substring(lineStart, callStart);
    const baseIndent = lineBeforeQuery.match(/^\s*/)?.[0] || '';
    
    if (lines.length > 1) {
      // Multi-line - use existing indentation
      const firstLineWithContent = lines.find(line => line.trim().length > 0);
      if (firstLineWithContent) {
        indent = firstLineWithContent.match(/^\s*/)?.[0] || '    ';
      }
      // Closing brace indentation is typically 2 spaces less
      closingIndent = indent.slice(0, Math.max(0, indent.length - 2));
    } else {
      // Single line - convert to multi-line, use base indent + 2 spaces
      indent = baseIndent + '  ';
      closingIndent = baseIndent;
    }
    
    // Add sessionToken - preserve original formatting
    let newArgs: string;
    if (lines.length > 1) {
      // Multi-line: add to end before closing brace
      const lastLine = lines[lines.length - 1];
      const hasTrailingComma = trimmedArgs.endsWith(',') || lastLine.trim().endsWith(',');
      newArgs = hasTrailingComma
        ? argsText.trimEnd().replace(/,\s*$/, '') + `,\n${indent}sessionToken: sessionToken || undefined`
        : argsText.trimEnd() + `,\n${indent}sessionToken: sessionToken || undefined`;
    } else {
      // Single line: convert to multi-line with proper formatting
      if (trimmedArgs) {
        // Parse the single-line arguments and format them properly
        const argsList = trimmedArgs.split(',').map(arg => arg.trim()).filter(arg => arg.length > 0);
        const formattedArgs = argsList.map(arg => `${indent}${arg}`).join(',\n');
        newArgs = `\n${formattedArgs},\n${indent}sessionToken: sessionToken || undefined`;
      } else {
        newArgs = `\n${indent}sessionToken: sessionToken || undefined`;
      }
    }
    
    const newCallText = callText.substring(0, openBrace + 1) + newArgs + '\n' + closingIndent + callText.substring(closeBrace);
    newContent = newContent.substring(0, callStart) + newCallText + newContent.substring(callEnd);
    
    // Extract mutation name for logging
    const mutationNameMatch = callText.match(/api\.mutations\.([^\s,]+)/);
    changes.push(`Added sessionToken to mutation: ${mutationNameMatch ? mutationNameMatch[1] : 'unknown'}`);
  }
  
  return { newContent, changes };
}

/**
 * Migrate a client component file
 */
function migrateClientComponent(filePath: string, content: string): { newContent: string; changes: string[] } {
  const changes: string[] = [];
  let newContent = content;
  
  const hasUseSessionTokenImport = content.includes('useSessionToken') && 
    /import\s+.*useSessionToken.*from\s+['"]@\/hooks\/useSessionToken['"]/.test(content);
  const hasUseSessionTokenHook = /const\s+sessionToken\s*=\s*useSessionToken\(\)/.test(content);
  
  // Find all useQuery calls - verify they're actual React hooks, not inside object literals or type annotations
  const useQueryMatches: Array<{ start: number; end: number; hasToken: boolean; isSkip: boolean }> = [];
  let useQueryIndex = 0;
  while ((useQueryIndex = content.indexOf('useQuery(', useQueryIndex)) !== -1) {
    // Check context before useQuery to ensure it's a hook call, not inside an object literal or type annotation
    const beforeUseQuery = content.substring(Math.max(0, useQueryIndex - 50), useQueryIndex);
    
    // Skip if it's inside a type annotation (e.g., `d: { useQuery(...) }`)
    if (beforeUseQuery.match(/:\s*\{[^}]*$/)) {
      useQueryIndex++;
      continue;
    }
    
    // Skip if it's inside an object literal property (e.g., `close: useQuery(...)`)
    if (beforeUseQuery.match(/['"]?\w+['"]?\s*:\s*[^,}]*$/)) {
      useQueryIndex++;
      continue;
    }
    
    // Verify it's likely a hook call (should be at start of line or after assignment/const)
    const lineStart = content.lastIndexOf('\n', useQueryIndex) + 1;
    const lineBefore = content.substring(lineStart, useQueryIndex);
    if (!lineBefore.match(/^\s*(const|let|var|\s*)/)) {
      // Not a hook call, skip
      useQueryIndex++;
      continue;
    }
    
    // Find the opening parenthesis
    const openParen = useQueryIndex + 'useQuery('.length;
    // Find comma after first argument
    let commaPos = content.indexOf(',', openParen);
    if (commaPos === -1) {
      // No second argument, skip
      useQueryIndex++;
      continue;
    }
    
    // Find the second argument (could be object, string, or conditional)
    const secondArgStart = content.substring(commaPos + 1).search(/\S/);
    if (secondArgStart === -1) {
      useQueryIndex++;
      continue;
    }
    
    const actualStart = commaPos + 1 + secondArgStart;
    let secondArgEnd = actualStart;
    
    // Check if it's a string literal
    if (content[actualStart] === '"' || content[actualStart] === "'") {
      const quote = content[actualStart];
      secondArgEnd = content.indexOf(quote, actualStart + 1);
      if (secondArgEnd === -1) {
        useQueryIndex++;
        continue;
      }
      secondArgEnd++;
    } else if (content[actualStart] === '{') {
      // It's an object
      secondArgEnd = findMatchingBrace(content, actualStart);
      if (secondArgEnd === -1) {
        useQueryIndex++;
        continue;
      }
      secondArgEnd++;
    } else {
      // Find the closing paren
      secondArgEnd = content.indexOf(')', actualStart);
      if (secondArgEnd === -1) {
        useQueryIndex++;
        continue;
      }
    }
    
    const secondArg = content.substring(actualStart, secondArgEnd);
    const isSkip = secondArg === '"skip"' || secondArg === "'skip'";
    const hasToken = secondArg.includes('sessionToken');
    
    useQueryMatches.push({
      start: useQueryIndex,
      end: secondArgEnd + 1,
      hasToken,
      isSkip
    });
    
    useQueryIndex = secondArgEnd + 1;
  }
  
  // Find all useMutation declarations
  const mutationNames = new Set<string>();
  const mutationDeclRegex = /const\s+(\w+)\s*=\s*useMutation\(/g;
  let mutationDeclMatch;
  while ((mutationDeclMatch = mutationDeclRegex.exec(content)) !== null) {
    mutationNames.add(mutationDeclMatch[1]);
  }
  
  // Find all mutation calls
  const mutationCallMatches: Array<{ start: number; end: number; name: string; hasToken: boolean }> = [];
  for (const mutationName of mutationNames) {
    let callIndex = 0;
    while ((callIndex = content.indexOf(`${mutationName}(`, callIndex)) !== -1) {
      const openParen = callIndex + mutationName.length + 1;
      const openBrace = content.indexOf('{', openParen);
      if (openBrace === -1) {
        callIndex++;
        continue;
      }
      const closeBrace = findMatchingBrace(content, openBrace);
      if (closeBrace === -1) {
        callIndex++;
        continue;
      }
      const args = content.substring(openBrace, closeBrace + 1);
      mutationCallMatches.push({
        start: callIndex,
        end: closeBrace + 1,
        name: mutationName,
        hasToken: args.includes('sessionToken')
      });
      callIndex = closeBrace + 1;
    }
  }
  
  // Check if everything already has sessionToken
  const allQueriesHaveToken = useQueryMatches.every(m => m.hasToken || m.isSkip);
  const allMutationsHaveToken = mutationCallMatches.every(m => m.hasToken);
  
  if (hasUseSessionTokenImport && hasUseSessionTokenHook && allQueriesHaveToken && allMutationsHaveToken) {
    return { newContent: content, changes: ['Already has sessionToken in all queries/mutations'] };
  }
  
  // Step 1: Add import if not present
  if (!hasUseSessionTokenImport) {
    const importRegex = /import\s+([^'"]*)\s+from\s+['"]@\/hooks\/useSessionToken['"]/;
    const importMatch = content.match(importRegex);
    
    if (!importMatch) {
      // Find a good place to add the import (after other hook imports)
      const hookImportMatch = content.match(/import\s+.*from\s+['"]@\/hooks\/[^'"]+['"]/);
      if (hookImportMatch) {
        const insertPos = hookImportMatch.index! + hookImportMatch[0].length;
        newContent = newContent.slice(0, insertPos) +
          '\nimport { useSessionToken } from \'@/hooks/useSessionToken\';' +
          newContent.slice(insertPos);
        changes.push('Added useSessionToken import');
      } else {
        // Add after first import
        const firstImport = content.indexOf('import');
        const firstImportLine = content.indexOf('\n', firstImport);
        if (firstImportLine > 0) {
          newContent = newContent.slice(0, firstImportLine + 1) +
            `import { useSessionToken } from '@/hooks/useSessionToken';\n` +
            newContent.slice(firstImportLine + 1);
          changes.push('Added useSessionToken import');
        }
      }
    }
  }
  
  // Step 2: Add useSessionToken hook call
  if (!hasUseSessionTokenHook) {
    // Find component function - be more careful with the regex
    // Match: export (default )?function FunctionName(...) {
    // Use a more specific pattern that matches the full function signature
    const componentMatch = content.match(/(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)/);
    if (componentMatch) {
      // Find the opening brace position - it should be at the end of the match
      const matchEnd = componentMatch.index! + componentMatch[0].length;
      // The opening brace should be the last character of the match
      if (content[matchEnd - 1] !== '{') {
        // Something went wrong, skip
        return { newContent: content, changes: ['Could not find function opening brace'] };
      }
      
      const funcStart = matchEnd; // Position right after the opening brace
      const afterFunc = content.substring(funcStart);
      
      // Find first hook call or state declaration after the opening brace
      const hookMatch = afterFunc.match(/(\s+const\s+\w+\s*=\s*(use\w+|useState|useEffect))/);
      
      if (hookMatch) {
        // Insert before the first hook
        const insertPos = funcStart + hookMatch.index!;
        // Determine indentation from the hook match
        const indent = hookMatch[1].match(/^\s*/)?.[0] || '  ';
        newContent = newContent.slice(0, insertPos) +
          `${indent}const sessionToken = useSessionToken();\n` +
          newContent.slice(insertPos);
        changes.push('Added useSessionToken hook call');
      } else {
        // Insert right after the opening brace
        // Determine indentation from the function line
        const lineStart = content.lastIndexOf('\n', componentMatch.index!) + 1;
        const lineBeforeFunc = content.substring(lineStart, componentMatch.index!);
        const baseIndent = lineBeforeFunc.match(/^\s*/)?.[0] || '';
        const indent = baseIndent + '  ';
        
        newContent = newContent.slice(0, funcStart) +
          `\n${indent}const sessionToken = useSessionToken();` +
          newContent.slice(funcStart);
        changes.push('Added useSessionToken hook call');
      }
    }
  }
  
  // Step 3: Update useQuery calls (process in reverse)
  for (let i = useQueryMatches.length - 1; i >= 0; i--) {
    const match = useQueryMatches[i];
    if (match.hasToken || match.isSkip) continue;
    
    const callStart = match.start;
    const callEnd = match.end;
    const callText = newContent.substring(callStart, callEnd);
    
    // Find the comma and second argument
    const commaPos = callText.indexOf(',');
    const secondArgStart = callText.substring(commaPos + 1).search(/\S/) + commaPos + 1;
    const secondArg = callText.substring(secondArgStart, callText.length - 1);
    
    // Determine indentation
    const lines = callText.split('\n');
    const indent = lines.length > 1 ? lines[1].match(/^\s*/)?.[0] || '    ' : '    ';
    
    // Update second argument
    let newSecondArg: string;
    if (secondArg.trim().startsWith('{')) {
      // It's an object - add sessionToken
      const openBrace = secondArg.indexOf('{');
      const closeBrace = findMatchingBrace(secondArg, openBrace);
      const argsText = secondArg.substring(openBrace + 1, closeBrace);
      const trimmedArgs = argsText.trim();
      const argIndent = lines.length > 1 ? lines[lines.length - 2].match(/^\s*/)?.[0] || indent : indent;
      
      newSecondArg = trimmedArgs.endsWith(',') 
        ? secondArg.substring(0, openBrace + 1) + trimmedArgs.slice(0, -1) + `,\n${argIndent}sessionToken: sessionToken || undefined\n${argIndent.slice(0, -2)}` + secondArg.substring(closeBrace)
        : secondArg.substring(0, openBrace + 1) + (trimmedArgs ? trimmedArgs + `,\n${argIndent}sessionToken: sessionToken || undefined` : `\n${argIndent}sessionToken: sessionToken || undefined`) + '\n' + argIndent.slice(0, -2) + secondArg.substring(closeBrace);
    } else {
      // Replace with conditional
      newSecondArg = `sessionToken ? { ...args, sessionToken } : "skip"`;
    }
    
    const newCallText = callText.substring(0, commaPos + 1) + ' ' + newSecondArg + ')';
    newContent = newContent.substring(0, callStart) + newCallText + newContent.substring(callEnd);
    
    // Extract query name
    const queryNameMatch = callText.match(/api\.queries\.([^\s,]+)/);
    changes.push(`Added sessionToken to useQuery: ${queryNameMatch ? queryNameMatch[1] : 'unknown'}`);
  }
  
  // Step 4: Update mutation calls (process in reverse)
  for (let i = mutationCallMatches.length - 1; i >= 0; i--) {
    const match = mutationCallMatches[i];
    if (match.hasToken) continue;
    
    const callStart = match.start;
    const callEnd = match.end;
    const callText = newContent.substring(callStart, callEnd);
    
    // Find the opening brace of the arguments object
    const openBrace = callText.indexOf('{');
    const closeBrace = findMatchingBrace(callText, openBrace);
    
    if (openBrace === -1 || closeBrace === -1) continue;
    
    const argsText = callText.substring(openBrace + 1, closeBrace);
    const trimmedArgs = argsText.trim();
    
    // Determine indentation
    const lines = argsText.split('\n');
    const indent = lines.length > 1 ? lines[1].match(/^\s*/)?.[0] || '    ' : '    ';
    
    // Add sessionToken
    const newArgs = trimmedArgs.endsWith(',') 
      ? trimmedArgs.slice(0, -1) + `,\n${indent}sessionToken: sessionToken || undefined`
      : (trimmedArgs ? trimmedArgs + `,\n${indent}sessionToken: sessionToken || undefined` : `\n${indent}sessionToken: sessionToken || undefined`);
    
    const newCallText = callText.substring(0, openBrace + 1) + newArgs + '\n' + indent.slice(0, -2) + callText.substring(closeBrace);
    newContent = newContent.substring(0, callStart) + newCallText + newContent.substring(callEnd);
    
    changes.push(`Added sessionToken to mutation call: ${match.name}`);
  }
  
  return { newContent, changes };
}

/**
 * Validate code for basic syntax errors
 */
function validateSyntax(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for balanced braces
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';
    
    // Handle string literals
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    }
    
    if (inString) continue;
    
    // Count braces, parens, brackets
    if (char === '{') braceDepth++;
    if (char === '}') {
      braceDepth--;
      if (braceDepth < 0) {
        errors.push(`Unmatched closing brace at position ${i}`);
      }
    }
    if (char === '(') parenDepth++;
    if (char === ')') {
      parenDepth--;
      if (parenDepth < 0) {
        errors.push(`Unmatched closing parenthesis at position ${i}`);
      }
    }
    if (char === '[') bracketDepth++;
    if (char === ']') {
      bracketDepth--;
      if (bracketDepth < 0) {
        errors.push(`Unmatched closing bracket at position ${i}`);
      }
    }
  }
  
  if (braceDepth !== 0) {
    errors.push(`Unmatched braces: ${braceDepth > 0 ? 'missing' : 'extra'} ${Math.abs(braceDepth)} closing brace(s)`);
  }
  if (parenDepth !== 0) {
    errors.push(`Unmatched parentheses: ${parenDepth > 0 ? 'missing' : 'extra'} ${Math.abs(parenDepth)} closing paren(s)`);
  }
  if (bracketDepth !== 0) {
    errors.push(`Unmatched brackets: ${bracketDepth > 0 ? 'missing' : 'extra'} ${Math.abs(bracketDepth)} closing bracket(s)`);
  }
  
  // Check for common syntax errors
  const commonErrors = [
    /,\s*[,}]/g, // Trailing commas before closing
    /{\s*}/g, // Empty objects (might be intentional, but check)
  ];
  
  // Check for double commas
  if (code.match(/,\s*,/)) {
    errors.push('Found double comma (likely syntax error)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Process a single file
 */
function processFile(filePath: string): MigrationResult {
  if (shouldSkipFile(filePath)) {
    return {
      file: filePath,
      changes: [],
      errors: [],
      skipped: true,
      reason: 'File is in skip list or already updated'
    };
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Determine file type
    const isApiRoute = filePath.includes('/api/') && filePath.endsWith('/route.ts');
    const isClientComponent = filePath.includes('/app/') && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'));
    
    if (!isApiRoute && !isClientComponent) {
      return {
        file: filePath,
        changes: [],
        errors: [],
        skipped: true,
        reason: 'Not an API route or client component'
      };
    }
    
    // Check if file uses Convex
    if (!content.includes('convex.query') && !content.includes('convex.mutation') && 
        !content.includes('useQuery') && !content.includes('useMutation')) {
      return {
        file: filePath,
        changes: [],
        errors: [],
        skipped: true,
        reason: 'File does not use Convex queries/mutations'
      };
    }
    
    let result: { newContent: string; changes: string[] };
    
    if (isApiRoute) {
      result = migrateApiRoute(filePath, content);
    } else {
      result = migrateClientComponent(filePath, content);
    }
    
    if (result.changes.length === 0) {
      return {
        file: filePath,
        changes: [],
        errors: [],
        skipped: true,
        reason: 'No changes needed'
      };
    }
    
    // Validate syntax before writing
    const validation = validateSyntax(result.newContent);
    if (!validation.valid) {
      return {
        file: filePath,
        changes: result.changes,
        errors: [`Syntax validation failed: ${validation.errors.join('; ')}`],
        skipped: false
      };
    }
    
    if (!DRY_RUN) {
      writeFileSync(filePath, result.newContent, 'utf-8');
    }
    
    return {
      file: filePath,
      changes: result.changes,
      errors: [],
      skipped: false
    };
  } catch (error) {
    return {
      file: filePath,
      changes: [],
      errors: [error instanceof Error ? error.message : String(error)],
      skipped: false
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Session Token Migration...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }
  
  const apiRoutes = await glob('apps/web/app/api/**/route.ts');
  const clientComponents = await glob('apps/web/app/**/*.{tsx,ts}');
  
  const allFiles = [...apiRoutes, ...clientComponents].filter(file => {
    if (SPECIFIC_FILE) {
      return file.includes(SPECIFIC_FILE);
    }
    return true;
  });
  
  console.log(`Found ${allFiles.length} files to process\n`);
  
  const results: MigrationResult[] = [];
  
  for (const file of allFiles) {
    const result = processFile(file);
    results.push(result);
    
    if (result.skipped && !result.reason?.includes('Already')) {
      continue; // Skip printing skipped files
    }
    
    if (result.changes.length > 0) {
      console.log(`✅ ${file}`);
      result.changes.forEach(change => console.log(`   - ${change}`));
      console.log();
    } else if (result.errors.length > 0) {
      console.log(`❌ ${file}`);
      result.errors.forEach(error => console.log(`   - Error: ${error}`));
      console.log();
    }
  }
  
  // Summary
  const changed = results.filter(r => r.changes.length > 0);
  const errors = results.filter(r => r.errors.length > 0);
  const skipped = results.filter(r => r.skipped);
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Changed: ${changed.length}`);
  console.log(`   ⚠️  Skipped: ${skipped.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);
  console.log(`   📝 Total: ${results.length}`);
  
  if (DRY_RUN && changed.length > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main().catch(console.error);

