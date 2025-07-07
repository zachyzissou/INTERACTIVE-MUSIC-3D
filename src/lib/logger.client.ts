export const logger = {
  info: (msg: string) => console.warn(`INFO: ${msg}`),
  debug: (msg: string) => console.warn(`DEBUG: ${msg}`),
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg),
}
