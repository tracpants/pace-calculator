#!/usr/bin/env node

/**
 * Design Token Validation Script
 * 
 * This script validates that all color usage in the codebase follows
 * the design token system. It checks JavaScript, CSS, and HTML files
 * for hardcoded colors and ensures proper design token usage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  // File patterns to check
  patterns: {
    js: '**/*.js',
    css: '**/*.css',
    html: '**/*.html'
  },
  
  // Directories to scan
  scanDirs: ['src'],
  
  // Directories to ignore
  ignoreDirs: ['node_modules', 'dist', '.git', 'coverage'],
  
  // Files to ignore
  ignoreFiles: [
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'playwright.config.js',
    'vitest.config.js',
    'eslint.config.js'
  ],
  
  // Allowed design token prefixes
  allowedTokenPrefixes: [
    '--color-',
    '--surface-',
    '--background-',
    '--text-',
    '--border-',
    '--interactive-',
    '--status-'
  ],
  
  // Color patterns to detect
  colorPatterns: {
    // Hex colors
    hex: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g,
    
    // RGB/RGBA colors
    rgb: /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi,
    
    // HSL/HSLA colors
    hsl: /hsla?\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?/gi,
    
    // Named colors (common ones)
    named: /\b(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey|cyan|magenta|lime|olive|navy|teal|silver|maroon|fuchsia|aqua)\b/gi
  },
  
  // Allowed patterns (that should not trigger violations)
  allowedPatterns: [
    // Design tokens
    /var\(--(?:color|surface|background|text|border|interactive|status)-/g,
    
    // CSS custom properties definitions
    /--(?:color|surface|background|text|border|interactive|status)-[a-z0-9-]+\s*:/g,
    
    // Standard CSS values
    /\b(transparent|inherit|initial|unset|currentColor|none)\b/gi,
    
    // Comments (ignore colors in comments)
    /\/\*[\s\S]*?\*\//g,
    /\/\/.*$/gm,
    
    // TailwindCSS utility classes (allow in class attributes)
    /class="[^"]*"/g,
    /className="[^"]*"/g,
    
    // Data attributes and test IDs
    /data-[a-z-]+=["'][^"']*["']/g,
    /test-[a-z-]+=["'][^"']*["']/g
  ],
  
  // Test file exceptions - allow hardcoded colors in test assertions
  testFileExceptions: [
    // Any line containing expect() with color values
    /expect\(.*\)/gi,
    
    // Lines with color assertions
    /\.(?:toBe|toEqual|toContain|toMatch|not\.toBe)\(/gi,
    
    // Array literals in test files (for color testing arrays)
    /\s*expect\s*\(\s*\[/gi,
    
    // Color value checks in test files
    /(?:backgroundColor|color|borderColor|includes|contains).*(?:#[A-Fa-f0-9]{3,6}|rgba?\([^)]+\)|(?:red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey|cyan|magenta|lime|olive|navy|teal|silver|maroon|fuchsia|aqua))/gi,
    
    // Test utility method calls
    /(?:some|every|includes|contains|match|test)\(/gi
  ]
};

// Validation results
const results = {
  totalFiles: 0,
  checkedFiles: 0,
  violations: [],
  tokenUsage: {
    correct: 0,
    violations: 0
  },
  summary: {
    errors: 0,
    warnings: 0
  }
};

/**
 * Check if a file should be ignored
 */
function shouldIgnoreFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const fileName = path.basename(filePath);
  
  // Ignore specific files
  if (CONFIG.ignoreFiles.includes(fileName)) {
    return true;
  }
  
  // Ignore directories
  if (CONFIG.ignoreDirs.some(dir => relativePath.includes(dir))) {
    return true;
  }
  
  return false;
}

/**
 * Get all files to check
 */
function getAllFiles() {
  const allFiles = [];
  
  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!shouldIgnoreFile(fullPath)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(file);
          if (['.js', '.css', '.html'].includes(ext) && !shouldIgnoreFile(fullPath)) {
            allFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
    }
  }
  
  // Scan configured directories
  CONFIG.scanDirs.forEach(dir => {
    const fullDir = path.join(projectRoot, dir);
    if (fs.existsSync(fullDir)) {
      scanDirectory(fullDir);
    }
  });
  
  return allFiles;
}

/**
 * Remove allowed patterns from content to avoid false positives
 */
function removeAllowedPatterns(content) {
  let cleanContent = content;
  
  CONFIG.allowedPatterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '');
  });
  
  return cleanContent;
}

/**
 * Check if a color usage is in a design token definition
 */
function isInTokenDefinition(content, match, index) {
  // Check if this color is part of a CSS custom property definition
  const beforeMatch = content.substring(Math.max(0, index - 50), index);
  
  // Check for CSS custom property definition pattern - more comprehensive
  if (/--(?:color|surface|background|text|border|interactive|status)-[a-z0-9-]+\s*:\s*$/.test(beforeMatch)) {
    return true;
  }
  
  // Also check if we're on a line that contains a CSS custom property definition
  const lineStart = content.lastIndexOf('\n', index);
  const lineEnd = content.indexOf('\n', index) === -1 ? content.length : content.indexOf('\n', index);
  const line = content.substring(lineStart + 1, lineEnd);
  
  // More comprehensive check for CSS custom property lines
  if (/^\s*--(?:color|surface|background|text|border|interactive|status)-[a-z0-9-]+\s*:\s*.+$/.test(line)) {
    return true;
  }
  
  // Check if it's inside a theme block (like .dark, .amoled, etc.)
  const blockStart = content.lastIndexOf('{', index);
  const selectorStart = content.lastIndexOf('\n', blockStart);
  const selector = content.substring(selectorStart + 1, blockStart).trim();
  
  if (selector.includes(':root') || selector.includes('.dark') || selector.includes('.amoled') || 
      selector.includes('.high-contrast') || selector.includes('.monochrome') ||
      selector.includes('[data-accent-color=')) {
    return true;
  }
  
  return false;
}

/**
 * Check a single file for design token violations
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(projectRoot, filePath);
    const fileExt = path.extname(filePath);
    
    results.totalFiles++;
    
    // Skip empty files
    if (!content.trim()) {
      return;
    }
    
    results.checkedFiles++;
    
    // Remove allowed patterns to avoid false positives
    const cleanContent = removeAllowedPatterns(content);
    
    // Check for color pattern violations
    Object.entries(CONFIG.colorPatterns).forEach(([type, pattern]) => {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(cleanContent)) !== null) {
        const colorValue = match[0];
        const index = match.index;
        
        // Skip if this is in a design token definition (for CSS files)
        if (fileExt === '.css' && isInTokenDefinition(content, match, index)) {
          continue;
        }
        
        // Skip if this is a test file and the color is in a test assertion
        if (relativePath.includes('test') || relativePath.includes('spec')) {
          const lineStart = content.lastIndexOf('\n', index);
          const lineEnd = content.indexOf('\n', index) === -1 ? content.length : content.indexOf('\n', index);
          const line = content.substring(lineStart + 1, lineEnd);
          
          // Check for eslint-disable comment on previous line
          const prevLineStart = content.lastIndexOf('\n', lineStart - 1);
          const prevLine = content.substring(prevLineStart + 1, lineStart);
          if (prevLine.includes('eslint-disable-next-line') && prevLine.includes('design-tokens')) {
            continue;
          }
          
          // Check if this color usage matches any test file exception patterns
          const isTestException = CONFIG.testFileExceptions.some(pattern => {
            pattern.lastIndex = 0; // Reset regex
            return pattern.test(line);
          });
          
          if (isTestException) {
            continue;
          }
        }
        
        // Calculate line number
        const beforeMatch = cleanContent.substring(0, index);
        const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
        
        // Get line content for context
        const lines = content.split('\n');
        const lineContent = lines[lineNumber - 1] || '';
        
        results.violations.push({
          file: relativePath,
          line: lineNumber,
          column: index - beforeMatch.lastIndexOf('\n'),
          type: type,
          value: colorValue,
          context: lineContent.trim(),
          severity: 'error'
        });
        
        results.tokenUsage.violations++;
        results.summary.errors++;
      }
    });
    
    // Count correct design token usage
    const tokenMatches = content.match(/var\(--(?:color|surface|background|text|border|interactive|status)-[a-z0-9-]+\)/g);
    if (tokenMatches) {
      results.tokenUsage.correct += tokenMatches.length;
    }
    
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
  }
}

/**
 * Print validation results
 */
function printResults() {
  console.log('\n🎨 Design Token Validation Results\n');
  console.log('='.repeat(50));
  
  console.log(`📁 Files scanned: ${results.checkedFiles}/${results.totalFiles}`);
  console.log(`✅ Correct token usage: ${results.tokenUsage.correct}`);
  console.log(`❌ Violations found: ${results.tokenUsage.violations}`);
  
  if (results.violations.length > 0) {
    console.log('\n🚨 Design Token Violations:\n');
    
    // Group violations by file
    const violationsByFile = {};
    results.violations.forEach(violation => {
      if (!violationsByFile[violation.file]) {
        violationsByFile[violation.file] = [];
      }
      violationsByFile[violation.file].push(violation);
    });
    
    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.log(`📄 ${file}:`);
      violations.forEach(violation => {
        console.log(`   Line ${violation.line}:${violation.column} - ${violation.type.toUpperCase()} color "${violation.value}"`);
        console.log(`   Context: ${violation.context}`);
        console.log(`   💡 Use design tokens instead: var(--color-primary), var(--surface-main), etc.\n`);
      });
    });
    
    console.log('🔧 Quick fixes:');
    console.log('• Replace hardcoded colors with design tokens from src/style.css');
    console.log('• Use: var(--color-primary), var(--surface-main), var(--text-secondary)');
    console.log('• For new colors, add them to the design token system first');
    console.log('• Run "npm run lint:fix" to auto-fix some issues\n');
  } else {
    console.log('\n🎉 All color usage follows design token standards!\n');
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Errors: ${results.summary.errors}`);
  console.log(`   Warnings: ${results.summary.warnings}`);
  console.log(`   Token compliance: ${results.tokenUsage.violations === 0 ? '100%' : Math.round((results.tokenUsage.correct / (results.tokenUsage.correct + results.tokenUsage.violations)) * 100)}%`);
  
  return results.violations.length === 0;
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Starting design token validation...\n');
  
  const files = getAllFiles();
  console.log(`Found ${files.length} files to check\n`);
  
  if (files.length === 0) {
    console.log('⚠️  No files found to validate');
    process.exit(0);
  }
  
  // Check each file
  files.forEach(checkFile);
  
  // Print results and exit with appropriate code
  const success = printResults();
  process.exit(success ? 0 : 1);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkFile, getAllFiles, CONFIG };