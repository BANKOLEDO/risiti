import { useEffect, useState } from 'react'
import { SEED_SLIPS, SEED_STALLS, photoForGoods, type DemoSlip, type SeedStall, type TraderVoice } from './seed'

const KEY = 'risiti.slips.v3'
const MODE_KEY = 'risiti.mode.v1'
const STALLS_KEY = 'risiti.stalls.v1'
const VOICES_KEY = 'risiti.voices.v1'

export type Mode = 'demo' | 'real'

function load(): DemoSlip[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoSlip[]
  } catch {
    /* ignore */
  }
  return SEED_SLIPS
}

/** Same-name sales only count after a witness co-signs. Stops self-dealing
 *  without blocking two different traders who share a name. */
function counts(s: DemoSlip) {
  return s.confirmed && (!s.sameName || s.witnessed)
}

/** Anti-collusion: at most 3 counted sales per counterparty. Wash-trading
 *  with one friend stops moving the score fast. */
function capped(slips: DemoSlip[]) {
  const seen = new Map<string, number>()
  return slips.filter((s) => {
    if (!counts(s)) return false
    const k = `${s.buyer.toLowerCase()} · ${s.market.toLowerCase()}`
    const n = seen.get(k) ?? 0
    if (n >= 3) return false
    seen.set(k, n + 1)
    return true
  })
}

/** Same formula as the headline score, per trader, from real slips. */
export function sellerStats(slips: DemoSlip[], name: string) {
  const mine = capped(slips.filter((s) => s.seller === name))
  const count = mine.length
  const volume = mine.reduce((a, s) => a + s.amountNum, 0)
  const witnessed = mine.filter((s) => s.witnessed).length
  const attested = mine.filter((s) => s.attested).length
  let score = 300 + Math.min(count * 50, 500) + Math.min(Math.floor(volume / 0.05), 60) + witnessed * 8 + attested * 12
  score = Math.max(300, Math.min(900, score))
  return { score, count, volume, witnessed, attested }
}

export function trustFromSlips(slips: DemoSlip[], aka: string[] = []) {
  const names = new Set(['You', 'Amina', ...aka])
  const mine = capped(slips.filter((s) => names.has(s.seller)))
  const count = mine.length
  const volume = mine.reduce((a, s) => a + s.amountNum, 0)
  const witnessed = mine.filter((s) => s.witnessed).length
  const attested = mine.filter((s) => s.attested).length
  let score = 300 + Math.min(count * 50, 500) + Math.min(Math.floor(volume / 0.05), 60) + witnessed * 8 + attested * 12
  score = Math.max(300, Math.min(900, score))
  // Top tier needs cryptographic proof, not just human taps.
  const limit = score >= 750 ? (attested > 0 ? 5 : 2) : score >= 620 ? 2 : score >= 500 ? 1 : score >= 400 ? 0.4 : 0
  return { score, count, volume, witnessed, attested, limit }
}

export function useRisitiStore() {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return (localStorage.getItem(MODE_KEY) as Mode) || 'demo'
    } catch {
      return 'demo'
    }
  })
  const [slips, setSlips] = useState<DemoSlip[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(slips))
    } catch {
      /* ignore */
    }
  }, [slips])

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  const confirm = (id: string) =>
    setSlips((p) => p.map((s) => (s.id === id ? { ...s, confirmed: true } : s)))
  const witness = (id: string) =>
    setSlips((p) => p.map((s) => (s.id === id ? { ...s, witnessed: true } : s)))
  const attest = (id: string) =>
    setSlips((p) => p.map((s) => (s.id === id ? { ...s, attested: true } : s)))
  const markVerbal = (id: string) =>
    setSlips((p) => p.map((s) => (s.id === id ? { ...s, verbal: true } : s)))
  /** Neighbour confirms for a buyer with no phone. Witness must differ from
   *  both parties — enforced in UI and on-chain (confirmVerbal). */
  const verbalConfirm = (id: string) =>
    setSlips((p) =>
      p.map((s) =>
        s.id === id && !s.confirmed ? { ...s, verbal: true, confirmed: true, witnessed: true } : s,
      ),
    )
  const add = (s: DemoSlip) => setSlips((p) => [s, ...p])
  const reset = () => setSlips(SEED_SLIPS)

  return { mode, setMode, slips, confirm, witness, attest, markVerbal, verbalConfirm, add, reset }
}

function loadStalls(): SeedStall[] {
  try {
    const raw = localStorage.getItem(STALLS_KEY)
    if (raw) {
      const mine = (JSON.parse(raw) as SeedStall[]).map((s) =>
        s.id.startsWith('my-') && s.photo === SEED_STALLS[0].photo && photoForGoods(s.goods) !== s.photo
          ? { ...s, photo: photoForGoods(s.goods) }
          : s,
      )
      const ids = new Set(mine.map((s) => s.id))
      return [...mine, ...SEED_STALLS.filter((s) => !ids.has(s.id))]
    }
  } catch {
    /* ignore */
  }
  return SEED_STALLS
}

/** All stalls: yours first, then the seeded markets. Persists to this phone. */
export function useStalls() {
  const [stalls, setStalls] = useState<SeedStall[]>(loadStalls)

  useEffect(() => {
    try {
      localStorage.setItem(STALLS_KEY, JSON.stringify(stalls.filter((s) => s.id.startsWith('my-'))))
    } catch {
      /* ignore */
    }
  }, [stalls])

  const addStall = (s: SeedStall) => setStalls((p) => (p.some((x) => x.id === s.id) ? p : [s, ...p]))
  return { stalls, addStall }
}

/** Trader voices: yours join the seeded ones, saved on this phone. */
export function useVoices() {
  const [mine, setMine] = useState<TraderVoice[]>(() => {
    try {
      const raw = localStorage.getItem(VOICES_KEY)
      if (raw) return JSON.parse(raw) as TraderVoice[]
    } catch {
      /* ignore */
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(VOICES_KEY, JSON.stringify(mine))
    } catch {
      /* ignore */
    }
  }, [mine])

  const addVoice = (v: TraderVoice) =>
    setMine((p) => (p.some((x) => x.who.toLowerCase() === v.who.toLowerCase()) ? p : [v, ...p]))
  return { mine, addVoice }
}
