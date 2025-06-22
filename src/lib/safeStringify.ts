export function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_k, v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return;
      seen.add(v);
    }
    return v as unknown;
  });
}
