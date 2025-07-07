#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findMarkdownFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', 'dist', '.git'].includes(entry.name)) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixMarkdownContent(content) {
  let fixed = content;

  // Fix multiple blank lines (MD012) - more aggressive
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  // Add blank lines around headings (MD022)
  fixed = fixed.replace(/(\S)(\n)(#{1,6}[^\n]*)/g, '$1\n\n$3');
  fixed = fixed.replace(/(#{1,6}[^\n]*)(\n)(\S)/g, '$1\n\n$3');

  // Add blank lines around lists (MD032)
  fixed = fixed.replace(/(\S)(\n)([*+-]|\d+\.)\s/g, '$1\n\n$3 ');
  fixed = fixed.replace(/([*+-]|\d+\.)[^\n]*(\n)([^*+\-\d\s\n])/g, '$1$2\n$3');

  // Add blank lines around code blocks (MD031)
  fixed = fixed.replace(/(\S)(\n)(```)/g, '$1\n\n$3');
  fixed = fixed.replace(/(```[^\n]*\n[\s\S]*?\n```)(\n)([^`\s\n])/g, '$1\n\n$3');

  // Remove trailing spaces (MD009)
  fixed = fixed.replace(/[ \t]+$/gm, '');

  // Remove trailing punctuation from headings (MD026)
  fixed = fixed.replace(/(#{1,6}[^#\n]*)[.,:;!?]+(\n)/g, '$1$2');

  // Fix emphasis used as heading (MD036)
  fixed = fixed.replace(/\n\*([^*\n]+)\*\n/g, '\n## $1\n');

  // Fix unordered list style to use asterisks (MD004)
  fixed = fixed.replace(/^(\s*)[-+]\s/gm, '$1* ');

  // Add language to code blocks without one (MD040)
  fixed = fixed.replace(/```\n([^`]*?)```/g, (match, code) => {
    // Try to guess language based on content
    if (code.includes('npm ') || code.includes('yarn ') || code.includes('npx ') || code.includes('docker ')) {
      return '```bash\n' + code + '```';
    } else if (code.includes('const ') || code.includes('import ') || code.includes('function ') || code.includes('module.exports')) {
      return '```javascript\n' + code + '```';
    } else if (code.includes('FROM ') || code.includes('RUN ') || code.includes('COPY ')) {
      return '```dockerfile\n' + code + '```';
    } else {
      return '```text\n' + code + '```';
    }
  });

  // Fix ordered list prefixes (MD029) - reset counters for each list
  const lines = fixed.split('\n');
  const fixedLines = [];
  let inOrderedList = false;
  let listCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isOrderedListItem = /^\s*\d+\.\s/.test(line);
    
    if (isOrderedListItem) {
      if (!inOrderedList) {
        listCounter = 1;
        inOrderedList = true;
      }
      fixedLines.push(line.replace(/^\s*\d+\./, line.match(/^\s*/)[0] + listCounter + '.'));
      listCounter++;
    } else {
      if (inOrderedList && line.trim() === '') {
        // Keep blank lines within lists
        fixedLines.push(line);
      } else if (inOrderedList && line.trim() !== '') {
        inOrderedList = false;
        fixedLines.push(line);
      } else {
        fixedLines.push(line);
      }
    }
  }

  fixed = fixedLines.join('\n');

  // Wrap long lines (MD013) - simple word wrapping for paragraphs only
  const wrappedLines = fixed.split('\n').map(line => {
    // Don't wrap headers, code blocks, lists, or URLs
    if (line.length > 80 && 
        !line.startsWith('#') && 
        !line.startsWith('```') && 
        !line.match(/^\s*[*+-]\s/) && 
        !line.match(/^\s*\d+\.\s/) && 
        !line.includes('http') &&
        !line.includes('`') &&
        line.trim() !== '') {
      
      const words = line.split(' ');
      let wrappedLine = '';
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + ' ' + word).length > 80) {
          if (currentLine) {
            wrappedLine += currentLine + '\n';
            currentLine = word;
          } else {
            currentLine = word; // Word is longer than 80 chars
          }
        } else {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        }
      }
      
      if (currentLine) {
        wrappedLine += currentLine;
      }
      
      return wrappedLine;
    }
    return line;
  });
  
  fixed = wrappedLines.join('\n');

  // Clean up any multiple blank lines that might have been introduced
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  // Ensure file ends with single newline
  fixed = fixed.replace(/\n*$/, '\n');

  return fixed;
}

function fixMarkdownFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixMarkdownContent(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed);
      console.log(`  ✓ Fixed ${filePath}`);
    } else {
      console.log(`  - No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`  ✗ Error fixing ${filePath}:`, error.message);
  }
}

// Find all markdown files
const markdownFiles = findMarkdownFiles('.');

console.log('Fixing markdown files comprehensively...');
markdownFiles.forEach(fixMarkdownFile);
console.log(`\nProcessed ${markdownFiles.length} markdown files`);
