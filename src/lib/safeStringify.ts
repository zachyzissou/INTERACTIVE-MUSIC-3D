export function safeStringify(obj: unknown) {
  const seen = new WeakSet()
  return JSON.stringify(obj, (_k, v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return
      seen.add(v)
    }
    return v
  })
}
