export function assertPrimitives(obj: any, path = 'root') {
  if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      const current = `${path}.${key}`
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
          val.forEach((v, i) => assertPrimitives(v, `${current}[${i}]`))
        } else if (Object.getPrototypeOf(val) !== Object.prototype) {
          throw new Error(`\u26d4\ufe0f Non-plain value at ${current}: ${
            (val as any).constructor.name
          }`)
        } else {
          assertPrimitives(val, current)
        }
      }
    }
  }
}
