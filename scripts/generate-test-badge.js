#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function generateTestBadge() {
  const testResultsPath = join(projectRoot, 'test-results.json');
  const badgesDir = join(projectRoot, 'badges');
  
  if (!existsSync(testResultsPath)) {
    console.error('❌ test-results.json not found. Run tests first.');
    process.exit(1);
  }
  
  try {
    const testResults = JSON.parse(readFileSync(testResultsPath, 'utf8'));
    
    // Calculate total number of tests
    const totalTests = testResults.testResults.reduce((total, file) => {
      return total + file.assertionResults.length;
    }, 0);
    
    // Check if all tests passed
    const allPassed = testResults.testResults.every(file => 
      file.assertionResults.every(test => test.status === 'passed')
    );
    
    const color = allPassed ? 'brightgreen' : 'red';
    const status = allPassed ? 'passing' : 'failing';
    
    // Generate shields.io badge URL
    const badgeUrl = `https://img.shields.io/badge/Tests-${totalTests}%20${status}-${color}.svg`;
    
    // Create a simple badge file that references the dynamic URL
    const badgeContent = `<!-- Dynamic test badge -->
<!-- This badge is automatically updated by generate-test-badge.js -->
[![Tests](${badgeUrl})](https://vitest.dev/)`;
    
    // Ensure badges directory exists
    if (!existsSync(badgesDir)) {
      import('fs').then(fs => fs.mkdirSync(badgesDir, { recursive: true }));
    }
    
    // Write badge markdown
    writeFileSync(join(badgesDir, 'tests-badge.md'), badgeContent);
    
    console.log(`✅ Test badge generated: ${totalTests} tests ${status}`);
    console.log(`📄 Badge URL: ${badgeUrl}`);
    
    return { totalTests, allPassed, badgeUrl };
  } catch (error) {
    console.error('❌ Error generating test badge:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateTestBadge();
}

export { generateTestBadge };