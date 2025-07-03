let logger: { info: (msg: string) => void; debug: (msg: string) => void; error: (msg: string) => void }

if (typeof window === 'undefined') {
  // Node.js environment
  logger = require('./logger.server').logger
} else {
  // Browser environment
  logger = require('./logger.client').logger
}

export { logger }
