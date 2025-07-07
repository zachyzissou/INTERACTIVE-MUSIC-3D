#!/usr/bin/env node

/**
 * INTERACTIVE-MUSIC-3D - Code Quality & Performance Fixes
 * 
 * This script applies the recommended fixes from the comprehensive analysis.
 * Run with: node scripts/apply-fixes.js
 */

const fs = require('fs').promises;
const path = require('path');

const fixes = [
  {
    file: 'src/components/PerformanceMonitor.tsx',
    line: 88,
    find: "console.log('Performance monitor toggled')",
    replace: "logger.info('Performance monitor toggled')",
    description: 'Replace console.log with proper logging'
  },
  {
    file: 'src/components/WebGPURenderer.tsx', 
    line: 135,
    find: 'console.log(',
    replace: 'logger.info(',
    description: 'Replace console.log with logger'
  },
  {
    file: 'src/components/XRButtons.tsx',
    line: 30,
    find: 'console.log(',
    replace: 'logger.info(',
    description: 'Replace console.log with logger'
  },
  {
    file: 'src/components/XRButtons.tsx',
    line: 41,
    find: 'console.log(',
    replace: 'logger.info(',
    description: 'Replace console.log with logger'
  },
  {
    file: 'src/components/XRCanvas.tsx',
    line: 58,
    find: 'console.log(',
    replace: 'logger.info(',
    description: 'Replace console.log with logger'
  },
  {
    file: 'src/components/XRCanvas.tsx',
    line: 70,
    find: 'console.log(',
    replace: 'logger.info(',
    description: 'Replace console.log with logger'
  }
];

async function applyFixes() {
  console.log('🔧 Applying code quality fixes...\n');
  
  for (const fix of fixes) {
    try {
      const filePath = path.join(__dirname, '..', fix.file);
      const content = await fs.readFile(filePath, 'utf8');
      
      if (content.includes(fix.find)) {
        const updatedContent = content.replace(new RegExp(fix.find, 'g'), fix.replace);
        await fs.writeFile(filePath, updatedContent);
        console.log(`✅ ${fix.file}: ${fix.description}`);
      } else {
        console.log(`⏭️  ${fix.file}: Already fixed or pattern not found`);
      }
    } catch (error) {
      console.log(`❌ ${fix.file}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🎉 Code quality fixes complete!');
}

if (require.main === module) {
  applyFixes().catch(console.error);
}

module.exports = { applyFixes };
