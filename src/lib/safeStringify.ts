/**
 * Safely stringify an object for logging.
 * - Removes circular references
 * - Skips Three.js objects like textures to avoid warnings
 * - Functions are stringified as their name
 */
export function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_k, v) => {
    if (typeof v === 'function') {
      return `[Function ${(v as Function).name || 'anonymous'}]`;
    }
    if (v && typeof v === 'object') {
      // Skip complex Three.js objects that implement toJSON (e.g., Texture)
      if ((v as any).isTexture || (v as any).isObject3D || (v as any).isMaterial) {
        return `[${(v as any).constructor?.name || 'Object'}]`;
      }
      if (seen.has(v)) return;
      seen.add(v);
    }
    return v as unknown;
  });
}
