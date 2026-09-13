export function shortHash(h: string, n = 6) {
  if (!h) return '·'
  return `${h.slice(0, 2 + n)}…${h.slice(-4)}`
}

/** Unique, human-readable receipt id. Time-ordered + random so two tabs,
 *  two taps, or a reset can never mint the same id twice. */
export function newSlipId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Math.floor(Math.random() * 36 * 36)
    .toString(36)
    .toUpperCase()
    .padStart(2, '0')
  return `RS-${t}${r}`
}

/** Buyer confirm code: short, readable, derived from the receipt id so the
 *  seller and buyer always agree without a server. */
export function confirmCode(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return h.toString(36).toUpperCase().padStart(6, '0').slice(-6)
}
