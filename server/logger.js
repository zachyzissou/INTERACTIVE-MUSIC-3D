const fs = require('fs')
const path = require('path')

const logDir = process.env.LOG_DIR || '/app/logs'
const logFile = path.join(logDir, 'app.log')

function write(level, message) {
  const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`
  try {
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(logFile, entry)
  } catch (err) {
    console.error('Failed to write log file', err)
  }
  if (level === 'error') console.error(message)
  else console.log(message)
}

module.exports = {
  logger: {
    info: (msg) => write('INFO', msg),
    debug: (msg) => write('DEBUG', msg),
    error: (msg) => write('ERROR', msg),
  },
}
