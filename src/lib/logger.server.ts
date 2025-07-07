import fs from 'fs'
import path from 'path'

const logDir = process.env.LOG_DIR || '/app/logs'
const logFile = path.join(logDir, 'app.log')

function write(level: string, message: string) {
  const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`
  try {
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(logFile, entry)
  } catch (err) {
    console.error('Failed to write log file', err)
  }
  if (level === 'error') console.error(message)
  else console.warn(`[${level}] ${message}`)
}

export const logger = {
  info: (msg: string) => write('INFO', msg),
  debug: (msg: string) => write('DEBUG', msg),
  error: (msg: string) => write('ERROR', msg),
}
