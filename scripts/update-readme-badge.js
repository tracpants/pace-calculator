#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function updateReadmeBadge() {
  const testResultsPath = join(projectRoot, 'test-results.json');
  const readmePath = join(projectRoot, 'README.md');
  
  try {
    const testResults = JSON.parse(readFileSync(testResultsPath, 'utf8'));
    let readme = readFileSync(readmePath, 'utf8');
    
    // Calculate total number of tests
    const totalTests = testResults.testResults.reduce((total, file) => total + file.assertionResults.length, 0);
    
    // Check if all tests passed
    const allPassed = testResults.testResults.every(file => 
      file.assertionResults.every(test => test.status === 'passed')
    );
    
    const color = allPassed ? 'brightgreen' : 'crimson';
    const status = allPassed ? 'passing' : 'failing';
    
    // Generate new badge URL
    const newBadgeUrl = `https://img.shields.io/badge/Tests-${totalTests}%20${status}-${color}.svg`;
    const newBadge = `[![Tests](${newBadgeUrl})](https://vitest.dev/)`;
    
    // Replace the test badge in README (look for the existing test badge pattern)
    const badgePattern = /\[!\[Tests\]\(https:\/\/img\.shields\.io\/badge\/Tests-\d+%20(passing|failing)-\w+\.svg\)\]\(https:\/\/vitest\.dev\/\)/;
    
    if (badgePattern.test(readme)) {
      readme = readme.replace(badgePattern, newBadge);
      writeFileSync(readmePath, readme);
      console.log(`✅ Updated README badge: ${totalTests} tests ${status}`);
    } else {
      console.log('⚠️ Test badge pattern not found in README.md');
    }
    
    return { totalTests, allPassed, updated: true };
  } catch (error) {
    console.error('❌ Error updating README badge:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateReadmeBadge();
}

export { updateReadmeBadge };