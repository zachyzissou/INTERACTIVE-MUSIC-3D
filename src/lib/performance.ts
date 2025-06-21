export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const ua = navigator.userAgent || ''
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = nav.deviceMemory ?? 8
  const saveData = nav.connection?.saveData ?? false
  return isMobile || cores <= 4 || memory <= 4 || saveData
}
