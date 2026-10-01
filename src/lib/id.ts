const RADIX = 36
const RANDOM_SLICE_START = 2

/** Unique id. `crypto.randomUUID` only exists in secure contexts (https / localhost). */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(RADIX)}-${Math.random().toString(RADIX).slice(RANDOM_SLICE_START)}`
}
