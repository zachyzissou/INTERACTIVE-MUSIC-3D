#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function findMarkdownFiles(dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && !['node_modules', '.next', 'dist', '.git'].includes(entry.name)) {
      files.push(...findMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  
  return files
}

function fixMarkdownFile(filePath) {
  console.log(`Fixing ${filePath}...`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Fix heading spacing (MD022)
  content = content.replace(/^(#{1,6}\s+.+)$/gm, (match, heading) => {
    return `\n${heading}\n`
  })
  
  // Fix list spacing (MD032)
  content = content.replace(/^([^\n]*[^\s])\n(\s*[-*+]\s+.+)/gm, '$1\n\n$2')
  content = content.replace(/^(\s*[-*+]\s+.+)\n([^\n]*[^\s])/gm, '$1\n\n$2')
  
  // Fix code block spacing (MD031)
  content = content.replace(/^([^\n]*[^\s])\n(\s*```)/gm, '$1\n\n$2')
  content = content.replace(/^(\s*```[^\n]*)\n([^\n]*[^\s])/gm, '$1\n\n$2')
  
  // Remove trailing spaces (MD009)
  content = content.replace(/[ \t]+$/gm, '')
  
  // Fix multiple H1 headings (MD025) - convert additional H1s to H2s
  const h1Count = (content.match(/^# /gm) || []).length
  if (h1Count > 1) {
    let firstH1Found = false
    content = content.replace(/^# /gm, (match) => {
      if (!firstH1Found) {
        firstH1Found = true
        return match
      }
      return '## '
    })
  }
  
  // Clean up extra blank lines
  content = content.replace(/\n{3,}/g, '\n\n')
  
  // Ensure file ends with single newline
  content = content.replace(/\n*$/, '\n')
  
  fs.writeFileSync(filePath, content)
}

// Find all markdown files
const markdownFiles = findMarkdownFiles('.')

console.log('Fixing markdown files...')
markdownFiles.forEach(fixMarkdownFile)
console.log(`Fixed ${markdownFiles.length} markdown files`)
