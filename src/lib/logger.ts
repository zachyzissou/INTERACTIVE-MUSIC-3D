// Universal logger that works in both Node.js and browser environments
interface Logger {
  info: (msg: string) => void
  debug: (msg: string) => void
  error: (msg: string) => void
  warn: (msg: string) => void
}

// Fallback logger for tests and immediate use
const fallbackLogger: Logger = {
  info: (msg: string) => process?.stdout ? process.stdout.write(`${msg}\n`) : undefined,
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg),
  debug: (msg: string) => process?.stdout ? process.stdout.write(`${msg}\n`) : undefined,
}

// Initialize appropriate logger based on environment
const initLogger = (): Logger => {
  if (typeof window === 'undefined') {
    // Node.js environment - use fallback for tests
    return fallbackLogger
  } else {
    // Browser environment
    try {
      return require('./logger.client').logger
    } catch {
      return fallbackLogger
    }
  }
}

export const logger = initLogger()
