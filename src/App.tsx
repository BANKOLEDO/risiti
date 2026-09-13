import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  BanknotesIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  EyeIcon,
  HomeIcon,
  PhotoIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
  UserGroupIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import { useAccount, useConnect, useDisconnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { ATTEST } from './lib/chain'
import { CONTRACTS, POOL_ABI, REGISTRY_ABI } from './lib/contracts'
import { formatEther, keccak256, parseEther } from 'viem'
import { SEED_STALLS, CURRENCIES, TRADER_VOICES, photoForGoods, normMarket, type SeedStall } from './lib/seed'
import { trustFromSlips, useRisitiStore, useStalls, useVoices, sellerStats } from './lib/store'
import type { ChainSlip, ChainVoice } from './lib/chainfeed'
import { shortHash, newSlipId, confirmCode } from './lib/format'
import type { AttestState } from './lib/attest'

const dice = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4`

export type Screen = 'home' | 'market' | 'new' | 'receipts' | 'score' | 'paper' | 'terms' | 'privacy'

const TABS: { id: Screen; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'market', label: 'Market' },
  { id: 'new', label: 'New' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'score', label: 'Score' },
]

function TopBar({ mode, setMode, screen, setScreen, trader }: { mode: 'demo' | 'real'; setMode: (m: 'demo' | 'real') => void; screen: Screen; setScreen: (s: Screen) => void; trader: string }) {
  const { address, isConnected, chainId } = useAccount()
  const onTestnet = chainId === 102031
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  return (
    <header className="screen-only sticky top-0 z-40 border-b-2 border-[var(--color-ink)] bg-[var(--color-paper)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-2 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
        <button type="button" onClick={() => setScreen('home')} className="flex shrink-0 items-center gap-2" aria-label="Risiti home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-ink)] text-[var(--color-paper)] sm:h-10 sm:w-10">
            <TicketIcon className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-left leading-none">
            <span className="block text-lg font-black tracking-tight">Risiti</span>
            {trader ? (
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{trader}'s stall</span>
            ) : null}
          </span>
        </button>
        <nav className="ml-auto hidden items-center gap-1 text-sm font-bold lg:flex" aria-label="Primary">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setScreen(t.id)}
              aria-current={screen === t.id ? 'page' : undefined}
              className={`rounded-full px-3 py-2 ${screen === t.id ? 'bg-[var(--color-ink)] text-[var(--color-paper)]' : 'hover:underline'}`}
            >
              {t.id === 'new' ? 'New receipt' : t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2" role="group" aria-label="Mode">
          <button
            type="button"
            onClick={() => { disconnect(); setMode('demo') }}
            aria-pressed={mode === 'demo'}
            className={`min-h-[38px] rounded-full px-2.5 text-[10px] font-black uppercase tracking-widest min-[380px]:px-3 min-[380px]:text-[11px] sm:min-h-[44px] sm:px-4 sm:text-xs ${mode === 'demo' ? 'bg-[var(--color-ink)] text-[var(--color-paper)]' : 'bg-[var(--color-card)]'}`}
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() => setMode('real')}
            aria-pressed={mode === 'real'}
            className={`min-h-[38px] rounded-full px-2.5 text-[10px] font-black uppercase tracking-widest min-[380px]:px-3 min-[380px]:text-[11px] sm:min-h-[44px] sm:px-4 sm:text-xs ${mode === 'real' ? 'bg-[var(--color-ctc)] text-white' : 'bg-[var(--color-card)]'}`}
          >
            Try it
          </button>
        </div>
        {isConnected ? (
          <button type="button" onClick={() => disconnect()} className="hidden min-h-[44px] rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-card)] px-3 text-xs font-bold sm:block" title={address}>
            {shortHash(address ?? '')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
            className="hidden min-h-[44px] rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-warm)] px-4 text-xs font-black uppercase tracking-widest text-white sm:block"
          >
            Connect
          </button>
        )}
        <span className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-widest md:inline-flex ${!isConnected ? 'bg-[var(--color-paper-deep)] text-[var(--color-muted)]' : onTestnet ? 'bg-[var(--color-leaf)]/15 text-[var(--color-leaf)]' : 'bg-[var(--color-stamp)]/15 text-[var(--color-stamp)]'}`}
          role="status">
          <span className={`inline-block h-2 w-2 rounded-full ${!isConnected ? 'bg-[var(--color-muted)]' : onTestnet ? 'bg-[var(--color-leaf)]' : 'bg-[var(--color-stamp)]'}`} />
          {!isConnected ? 'No wallet' : onTestnet ? 'Testnet · 102031' : 'Wrong network'}
        </span>
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--color-line)] px-3 py-1.5 sm:hidden">
        <span className={`inline-block h-2 w-2 rounded-full ${!isConnected ? 'bg-[var(--color-muted)]' : onTestnet ? 'bg-[var(--color-leaf)]' : 'bg-[var(--color-stamp)]'}`} />
        <span className="tabular text-[10.5px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
          {!isConnected ? 'No wallet' : onTestnet ? 'Testnet · 102031 · live' : 'Wrong network · switch to 102031'}
        </span>
        {isConnected ? (
          <button type="button" onClick={() => disconnect()} className="ml-auto min-h-[36px] rounded-full bg-[var(--color-card)] px-3 text-[11px] font-black" title={address}>
            {shortHash(address ?? '')} · out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
            className="ml-auto min-h-[36px] rounded-full bg-[#ff3c1a] px-4 text-[11px] font-black uppercase tracking-widest text-white"
          >
            Connect wallet
          </button>
        )}
      </div>
    </header>
  )
}

function Hero({ onNew, mode, onGo, amina, totalSales }: { onNew: () => void; mode: 'demo' | 'real'; onGo: (s: Screen) => void; amina: { score: number; count: number }; totalSales: number }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden border-b-2 border-black bg-[#0a0908] text-[#faf5ea]" aria-labelledby="hero-h">
      <img
        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=60&w=1600&auto=format&fit=crop"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
        loading="eager"
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden
        style={{ background: 'radial-gradient(60% 50% at 70% 20%, rgba(255,60,30,0.35), transparent 65%), linear-gradient(to bottom, rgba(10,9,8,0.55), rgba(10,9,8,0.92))' }} />
      {mode === 'demo' ? (
        <p className="relative border-b border-white/10 bg-white/5 px-4 py-2.5 text-center text-[13px] font-semibold text-white/85">
          <strong className="text-white">Demo mode:</strong> no wallet, no money. First <button type="button" className="underline" onClick={() => onGo('new')}>add a receipt</button>, tap Confirm · connect a wallet only for Try-it.
        </p>
      ) : (
        <p className="relative border-b border-white/10 bg-[#0b3dff] px-4 py-2.5 text-center text-[13px] font-semibold text-white">
          <strong>Try-it mode:</strong> connect wallet on Creditcoin testnet (102031). Free test funds in Discord #token-faucet.
        </p>
      )}
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pb-10 pt-8 sm:pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ff3c1a]" /> BUIDL CTC 2026 Fall · DeFi + RWA
          </p>
          <h1 id="hero-h" className="mt-3 text-[3rem] font-black leading-[0.92] tracking-tight sm:text-7xl">
            SALES
            <br />
            ARE <span className="text-[#ff5a2b]">CREDIT.</span>
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/80">
            Amina sells ₦180 of tomatoes. Musa taps confirm. At 2 confirmed sales she unlocks a
            zero-interest advance. No bank, no collateral, no forms. That is the whole app.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-black uppercase tracking-widest" aria-label="Tracks">
            {['DeFi · advances', 'RWA · stock + sales', 'Trust · open formula'].map((pill) => (
              <li key={pill} className="rounded-full border border-white/25 bg-white/5 px-2.5 py-1 text-white/80 backdrop-blur">{pill}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-row items-stretch gap-2">
            <button type="button" onClick={onNew} className="min-h-[48px] flex-1 rounded-full bg-[#ff3c1a] px-2 text-[13px] font-black leading-tight text-white shadow-[0_0_36px_rgba(255,60,26,0.45)] sm:flex-none sm:px-4 sm:text-sm">
              Write your first receipt
            </button>
            <button type="button" onClick={() => onGo('receipts')} className="grid min-h-[48px] flex-1 place-items-center rounded-full border border-white/30 bg-white/5 px-2 text-[13px] font-black leading-tight text-white backdrop-blur sm:flex-none sm:px-4 sm:text-sm">
              See live ledger
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <motion.figure
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-6 text-center backdrop-blur"
          >
            <img src={dice('Amina')} alt="Amina avatar" className="mx-auto h-16 w-16 rounded-full bg-white object-cover ring-2 ring-white/40" loading="eager" />
            <p className="mt-3 text-[16px] font-bold leading-snug">“Six years of sales, nothing to show the bank. Now my receipts speak.”</p>
            <p className="tabular mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Amina · grains · {amina.score}/900</p>
            <p className="mt-2 inline-block rounded-full bg-[#ff3c1a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">Proven trader</p>
            <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2 border-t border-white/15 pt-4 text-center">
              {[[String(totalSales), 'sales'], [String(amina.score), 'standing'], ['0%', 'interest']].map(([k, v]) => (
                <div key={v}><p className="tabular text-lg font-black leading-none">{k}</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/55">{v}</p></div>
              ))}
            </div>
          </motion.figure>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="overflow-hidden py-3" aria-label="Ecosystem">
          <div className="ticker-track flex w-max gap-8 px-4">
            {['CREDITCOIN', 'ATTESTCOIN', 'BUIDL CTC', 'CEIP', 'tCTC', 'SEPOLIA PROVEN', 'CREDITCOIN', 'ATTESTCOIN', 'BUIDL CTC', 'CEIP', 'tCTC', 'SEPOLIA PROVEN'].map((w, i) => (
              <span key={i} className="tabular whitespace-nowrap text-[12px] font-black uppercase tracking-[0.28em] text-white/45">{w} <span className="ml-8 text-[#ff3c1a]">+</span></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
/* ---------- Landing: Kensei tiers + pool table ---------- */

function TierCards({ onGo }: { onGo: (s: Screen) => void }) {
  const tiers = [
    { min: '400', take: '0.4', label: 'First trust', need: '2 receipts' },
    { min: '500', take: '1.0', label: 'Steady hands', need: '4 receipts' },
    { min: '620', take: '2.0', label: 'Market anchor', need: '8 receipts' },
    { min: '750', take: '5.0', label: 'Top tier', need: '12 receipts + 1 verified restock' },
  ]
  return (
    <section aria-labelledby="tiers-h" className="mx-auto max-w-6xl px-4 pt-8">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">Rarity of trust · standing tiers</p>
      <h2 id="tiers-h" className="display-tight mt-1 text-3xl font-black sm:text-4xl">YOUR SALES, RANKED.</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <button key={tier.min} type="button" onClick={() => onGo('score')}
            className="ink-card-flat rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5">
            <p className="tabular text-4xl font-black">{tier.min}<span className="text-base text-[var(--color-muted)]">+</span></p>
            <p className="mt-1 text-sm font-black">{tier.label}</p>
            <p className="tabular mt-2 inline-block rounded-full bg-[#0c0b09] px-2.5 py-1 text-[12px] font-black text-white">take {tier.take} tCTC</p>
            <p className="mt-2 text-[12px] font-semibold text-[var(--color-muted)]">{tier.need}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function PoolTable({ slips, pot, live, chain, loading, onRefresh, myAddr, busy, onConfirm, onWitness }: {
  slips: ReturnType<typeof useRisitiStore>['slips']
  pot: number
  live: boolean
  chain: ChainSlip[] | null
  loading: boolean
  onRefresh: () => void
  myAddr?: string
  busy: boolean
  onConfirm: (n: bigint) => void
  onWitness: (n: bigint) => void
}) {
  const demoRows = slips.slice(0, 50)
  const allRows = live ? (chain ?? []) : demoRows
  const [page, setPage] = useState(0)
  const PER = 5
  const pages = Math.max(1, Math.ceil(allRows.length / PER))
  useEffect(() => { setPage(0) }, [allRows.length, live])
  const rows = allRows.slice(page * PER, page * PER + PER)
  return (
    <section aria-labelledby="pool-h" className="mx-auto max-w-6xl px-4 pt-4">
      <div className="bg-[var(--color-card)]">
        <div className="flex items-center gap-2 px-1 py-2">
          <h2 id="pool-h" className="display-tight text-xl font-black">LIVE LEDGER{live ? ' · ON-CHAIN' : ''}</h2>
          {live ? (
            <button type="button" onClick={onRefresh} className="tabular ml-auto min-h-[40px] px-3 text-[12px] font-black underline underline-offset-4">
              {loading ? 'Reading chain…' : 'Refresh from chain'}
            </button>
          ) : (
            <span className="tabular ml-auto rounded-full bg-[var(--color-leaf)]/15 px-3 py-1 text-[12px] font-black text-[var(--color-leaf)]">pot {pot.toFixed(2)} tCTC</span>
          )}
        </div>
        {live && (chain ?? []).length === 0 && !loading && (
          <p className="px-1 py-3 text-[13.5px] font-semibold text-[var(--color-muted)]">No receipts on-chain yet · open the first one below, then refresh.</p>
        )}
        <ul className="divide-y divide-[var(--color-line)] sm:hidden">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5 px-1 py-2.5">
              <img src={live ? dice(s.seller) : (s as { sellerAvatar: string }).sellerAvatar} alt="" className="h-8 w-8 shrink-0 rounded-full" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-black">{live ? `${shortHash(s.seller)} → ${shortHash(s.buyer)}` : `${(s as { seller: string }).seller} → ${(s as { buyer: string }).buyer}`}</span>
                <span className="tabular block text-[12px] font-semibold text-[var(--color-muted)]">{s.id} · {s.amount}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-black uppercase tracking-widest ${s.confirmed ? 'bg-[var(--color-leaf)]/15 text-[var(--color-leaf)]' : 'bg-[var(--color-paper-deep)]'}`}>
                {s.confirmed ? 'done' : ('attested' in s && (s as { attested?: boolean }).attested ? 'proven' : 'open')}
              </span>
            </li>
          ))}
        </ul>
        {live && myAddr && (
          <div className="flex flex-wrap gap-2 px-1 py-2">
            {(chain ?? []).filter((s) => !s.confirmed && s.buyer.toLowerCase() === myAddr.toLowerCase()).slice(0, 3).map((s) => (
              <button key={`c-${s.id}`} type="button" disabled={busy}
                onClick={() => onConfirm(BigInt(s.id.replace('CC3-', '')))}
                className="min-h-[44px] bg-[var(--color-leaf)] px-4 text-[13px] font-black text-white disabled:opacity-50">
                Confirm {s.id} on-chain
              </button>
            ))}
            {(chain ?? []).filter((s) => s.confirmed && !s.witnessed && s.seller.toLowerCase() !== myAddr.toLowerCase() && s.buyer.toLowerCase() !== myAddr.toLowerCase()).slice(0, 3).map((s) => (
              <button key={`w-${s.id}`} type="button" disabled={busy}
                onClick={() => onWitness(BigInt(s.id.replace('CC3-', '')))}
                className="min-h-[44px] bg-white px-4 text-[13px] font-black ring-1 ring-[var(--color-ink)] disabled:opacity-50">
                Co-sign {s.id}
              </button>
            ))}
          </div>
        )}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-left text-[13.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <th className="px-1 py-2 font-black">Trader</th>
                <th className="px-2 py-2 font-black">Deal</th>
                <th className="px-2 py-2 text-right font-black">Value</th>
                <th className="px-1 py-2 text-right font-black">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-line)]">
                  <td className="px-1 py-2.5">
                    <span className="flex items-center gap-2 font-black">
                      <img src={live ? dice(s.seller) : (s as { sellerAvatar: string }).sellerAvatar} alt="" className="h-7 w-7 rounded-full" loading="lazy" />
                      {live ? `${shortHash(s.seller)} → ${shortHash(s.buyer)}` : `${(s as { seller: string }).seller} → ${(s as { buyer: string }).buyer}`}
                    </span>
                  </td>
                  <td className="tabular px-2 py-2.5 text-[var(--color-muted)]">{s.id}</td>
                  <td className="tabular px-2 py-2.5 text-right font-black">{s.amount}</td>
                  <td className="px-1 py-2.5 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${s.confirmed ? 'bg-[var(--color-leaf)]/15 text-[var(--color-leaf)]' : 'bg-[var(--color-paper-deep)]'}`}>
                      {s.confirmed ? 'confirmed' : ('attested' in s && (s as { attested?: boolean }).attested ? 'proven' : 'open')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center gap-2 px-1 py-3">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="min-h-[44px] px-4 text-[13px] font-black disabled:opacity-40">← Newer</button>
            <span className="tabular text-[12px] font-bold text-[var(--color-muted)]">Page {page + 1} of {pages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
              className="min-h-[44px] px-4 text-[13px] font-black disabled:opacity-40">Older →</button>
          </div>
        )}
      </div>
    </section>
  )
}

function TradersVoices({ slips, extras, chain, trader, live, onAdd }: {
  slips: ReturnType<typeof useRisitiStore>['slips']
  extras: { who: string; trade: string; quote: string }[]
  chain: ChainVoice[]
  trader: string
  live: boolean
  onAdd: (v: { who: string; trade: string; quote: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [quote, setQuote] = useState('')
  const [trade, setTrade] = useState('')
  const [err, setErr] = useState('')
  const [vPage, setVPage] = useState(0)
  const all = [...extras, ...TRADER_VOICES]
  const VPER = 6
  useEffect(() => { setVPage(0) }, [all.length])
  const save = () => {
    const who = (trader || 'You').trim()
    if (quote.trim().length < 12) {
      setErr('Give it a full sentence · at least a few words.')
      return
    }
    setErr('')
    onAdd({ who, trade: trade.trim() || 'market', quote: quote.trim() })
    setQuote('')
    setTrade('')
    setOpen(false)
  }
  return (
    <section aria-labelledby="voices-h" className="mx-auto max-w-6xl px-4 pt-4">
      <div className="flex items-end gap-3">
        <h2 id="voices-h" className="text-2xl font-black tracking-tight">Traders, speaking</h2>
        <button type="button" onClick={() => setOpen(true)}
          className="mb-0.5 ml-auto min-h-[40px] px-3 text-[12px] font-black underline underline-offset-4">
          Share your story
        </button>
      </div>
      {open && (
        <div className="screen-only fixed inset-0 z-50 overflow-y-auto bg-[#0c0b09]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="voice-h"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="mx-auto my-8 w-full max-w-xl bg-[var(--color-card)] p-5">
            <div className="flex items-center gap-2">
              <h3 id="voice-h" className="text-xl font-black tracking-tight">Your words · as {trader || 'You'}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                className="ml-auto grid h-11 w-11 place-items-center text-2xl font-black leading-none">×</button>
            </div>
            <label htmlFor="voice-quote" className="mt-3 block text-[13px] font-black uppercase tracking-widest">Your story</label>
            <input id="voice-quote" value={quote} onChange={(e) => setQuote(e.target.value)}
              placeholder="e.g. My first advance bought two new bags."
              className="mt-1.5 min-h-[52px] w-full border border-[var(--color-line)] bg-white px-4 text-[16px] font-semibold" autoComplete="off" />
            <label htmlFor="voice-trade" className="mt-2 block text-[13px] font-black uppercase tracking-widest">What you sell (optional)</label>
            <input id="voice-trade" value={trade} onChange={(e) => setTrade(e.target.value)}
              placeholder="e.g. tomatoes"
              className="mt-1.5 min-h-[52px] w-full border border-[var(--color-line)] bg-white px-4 text-[16px] font-semibold" autoComplete="off" />
            {err ? <p role="alert" className="mt-2 text-[13.5px] font-bold text-[var(--color-stamp)]">{err}</p> : null}
            <button type="button" onClick={save} className="hard-btn mt-3 min-h-[48px] bg-[#ff3c1a] px-6 text-[15px] font-black text-white">
              Add my voice{live ? ' · on-chain' : ''}
            </button>
            {live && <p className="mt-2 text-[12px] font-semibold text-[var(--color-muted)]">Posts to the chain · every phone on earth reads it. Needs a wallet signature.</p>}
          </div>
        </div>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {chain.slice(0, 6).map((v) => (
          <figure key={`chain-${v.trader}-${v.quote.slice(0, 12)}`} className="bg-[#0c0b09] p-5 text-center text-white">
            <img src={dice(v.trader)} alt="" className="mx-auto h-12 w-12 rounded-full bg-white object-cover" loading="lazy" />
            <blockquote className="mt-2 text-[14px] font-bold leading-snug">“{v.quote}”</blockquote>
            <figcaption className="tabular mt-1.5 text-[10.5px] font-black uppercase tracking-[0.16em] text-white/55">{shortHash(v.trader)} · {v.trade} · on-chain</figcaption>
          </figure>
        ))}
        {all.slice(vPage * VPER, vPage * VPER + VPER).map((v) => {
          const st = sellerStats(slips, v.who)
          return (
          <figure key={v.who} className="bg-[var(--color-card)] p-5 text-center">
            <img src={dice(v.who)} alt={`${v.who} avatar`} className="mx-auto h-12 w-12 rounded-full bg-white object-cover ring-2 ring-[var(--color-line)]" loading="lazy" />
            <blockquote className="mt-2 text-[14px] font-bold leading-snug">“{v.quote}”</blockquote>
            <figcaption className="tabular mt-1.5 text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">{v.who} · {v.trade} · {st.score}/900</figcaption>
            <p className="tabular mt-2 text-lg font-black leading-none">{st.count}<span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">sales</span></p>
          </figure>
          )
        })}
      </div>
      {Math.ceil(all.length / VPER) > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={() => setVPage((p) => Math.max(0, p - 1))} disabled={vPage === 0}
            className="min-h-[44px] px-4 text-[13px] font-black disabled:opacity-40">← Newer</button>
          <span className="tabular text-[12px] font-bold text-[var(--color-muted)]">Page {vPage + 1} of {Math.ceil(all.length / VPER)}</span>
          <button type="button" onClick={() => setVPage((p) => Math.min(Math.ceil(all.length / VPER) - 1, p + 1))} disabled={vPage >= Math.ceil(all.length / VPER) - 1}
            className="min-h-[44px] px-4 text-[13px] font-black disabled:opacity-40">Older →</button>
        </div>
      )}
    </section>
  )
}

function AddStallForm({ trader, ccy, onAdd }: { trader: string; ccy: string; onAdd: (s: SeedStall) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [market, setMarket] = useState('')
  const [goods, setGoods] = useState('')
  const [price, setPrice] = useState('')
  const [photo, setPhoto] = useState(SEED_STALLS[0].photo)
  const [picked, setPicked] = useState(false)
  const [err, setErr] = useState('')
  if (!open) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-2">
        <button type="button" onClick={() => setOpen(true)} className="min-h-[48px] w-full bg-[#0c0b09] text-[14px] font-black text-white sm:w-auto sm:px-6">
          Add your stall · any market on earth
        </button>
      </div>
    )
  }
  const save = () => {
    if (!name.trim() || !market.trim() || !goods.trim() || !price.trim()) {
      setErr('Fill every line · it takes 20 seconds.')
      return
    }
    setErr('')
    const n = name.trim()
    onAdd({
      id: `my-${Date.now().toString(36)}`,
      name: n,
      owner: trader || 'You',
      market: market.trim(),
      avatar: dice(n),
      photo: picked ? photo : photoForGoods(goods.trim()),
      goods: goods.trim(),
      price: `${ccy} ${price.trim()}`,
    })
  }
  return (
    <div className="screen-only fixed inset-0 z-50 overflow-y-auto bg-[#0c0b09]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="add-stall-h"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="mx-auto my-8 w-full max-w-xl bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-2">
          <h2 id="add-stall-h" className="text-xl font-black tracking-tight">Your stall</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close"
            className="ml-auto grid h-11 w-11 place-items-center text-2xl font-black leading-none">×</button>
        </div>
        <div className="mt-3 grid gap-3">
          <div>
            <label htmlFor="stall-name" className="text-[13px] font-black uppercase tracking-widest">Stall name</label>
            <input id="stall-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mama Ada Provisions"
              className="mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[17px] font-semibold outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="stall-market" className="text-[13px] font-black uppercase tracking-widest">Market · city</label>
            <input id="stall-market" value={market} onChange={(e) => setMarket(e.target.value)} placeholder="e.g. Mile 12 · Lagos"
              className="mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[17px] font-semibold outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" autoComplete="off" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="stall-goods" className="text-[13px] font-black uppercase tracking-widest">What you sell</label>
            <input id="stall-goods" value={goods} onChange={(e) => setGoods(e.target.value)} placeholder="e.g. Rice and oil"
              className="mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[17px] font-semibold outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="stall-price" className="text-[13px] font-black uppercase tracking-widest">Price ({ccy})</label>
            <input id="stall-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="e.g. 500"
              className="tabular mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[20px] font-black outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" autoComplete="off" />
          </div>
          </div>
          <fieldset>
            <legend className="text-[13px] font-black uppercase tracking-widest">Pick a photo</legend>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {SEED_STALLS.map((s) => (
                <button key={s.id} type="button" onClick={() => { setPhoto(s.photo); setPicked(true) }} aria-pressed={photo === s.photo}
                  className={`${photo === s.photo ? 'ring-4 ring-[#ff3c1a]' : ''}`}>
                  <img src={s.photo} alt={s.name} className="photo-warm h-14 w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {err ? <p role="alert" className="mt-2 text-[13.5px] font-bold text-[var(--color-stamp)]">{err}</p> : null}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={save} className="hard-btn min-h-[48px] flex-none bg-[#ff3c1a] px-6 text-[15px] font-black text-white">Save my stall</button>
          <button type="button" onClick={() => setOpen(false)} className="min-h-[48px] px-4 text-[13px] font-bold text-[var(--color-muted)] underline underline-offset-4">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function Whitepaper() {
  return (
    <article aria-labelledby="paper-h" className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Risiti whitepaper · BUIDL CTC 2026 Fall · DeFi + RWA</p>
      <h2 id="paper-h" className="display-tight mt-1 text-4xl font-black">MARKET RECEIPTS, ON-CHAIN CREDIT.</h2>
      <div className="mt-5 grid gap-5 text-[14.5px] leading-relaxed">
        <section><h3 className="text-lg font-black">1 · Abstract</h3><p className="mt-1 text-[var(--color-muted)]">Two billion informal traders have no bank history. Risiti manufactures it: sellers open receipts, buyers confirm with 6-letter codes, neighbours co-sign. Confirmed sales build a deterministic 300–900 standing score that unlocks zero-interest 7-day community advances. Supplier restocks paid on Sepolia are proven on Creditcoin through the Attestcoin Protocol and boost standing. Money never moves inside the app.</p></section>
        <section><h3 className="text-lg font-black">2 · Problem</h3><p className="mt-1 text-[var(--color-muted)]">Banks demand history traders never had. Existing on-chain credit scores rich pasts and lends to the already-banked. The unbanked stay out. Meanwhile every market already runs on trust: the sale and the neighbour's nod. That trust was never recorded.</p></section>
        <section><h3 className="text-lg font-black">3 · System</h3><p className="mt-1 text-[var(--color-muted)]">Five phone screens (Home, Market, New, Bills, Score) over two quarantined rails. Demo rails run offline on localStorage. Try-it rails sign real Creditcoin testnet transactions through three contracts: Registry (receipts, score, proofs, voices), Pool (advances), Verifier (proof checks). Switching to Demo disconnects the wallet; nothing crosses the wall.</p></section>
        <section><h3 className="text-lg font-black">4 · Attestcoin integration</h3><p className="mt-1 text-[var(--color-muted)]">Restock payments happen on Sepolia. After attestation (~9 min), Merkle + continuity proofs verify against the BlockProver precompile 0xFD2 — first as a read check, then enforced inside the state-changing linkRestockProof call, whose struct layout matches the official SDK ABI exactly. Replay-guarded, permissionless, and load-bearing: verified restocks add +2 sales, and the top advance tier additionally requires one verified restock.</p></section>
        <section><h3 className="text-lg font-black">5 · Standing</h3><p className="mt-1 text-[14.5px] text-[var(--color-muted)]">300 + 50 per confirmed sale (cap 500) + volume curve (cap 60) + 8 per co-sign + 12 per verified top-up − 120 per default, clamped 300–900. Tiers unlock 0.4 / 1 / 2 / 5 tCTC; two sales hit exactly 400. Same formula on phone and chain.</p></section>
        <section><h3 className="text-lg font-black">6 · Anti-fraud</h3><p className="mt-1 text-[var(--color-muted)]">Parties can never sign their own receipts, in UI or contract. Same-name sales need a witness to count. Max 3 counted sales per counterparty kills wash-trading. One proof boosts once. No-phone sales need a third-party stand-in. Advances start tiny and short, so grinding costs more than it earns.</p></section>
        <section><h3 className="text-lg font-black">7 · Roadmap</h3><p className="mt-1 text-[var(--color-muted)]">Live now: on-chain receipts, buyer codes, community pot, restock proofs. Next: SMS codes, per-market cooperative pots, lender dashboard. With CEIP: CertiK audit, mainnet, bank API for statements.</p></section>
      </div>
    </article>
  )
}

function Terms() {
  return (
    <article aria-labelledby="terms-h" className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Risiti · hackathon demo</p>
      <h2 id="terms-h" className="mt-1 text-3xl font-black tracking-tight">Terms of use</h2>
      <div className="mt-4 grid gap-4 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
        <p>1 · Risiti is a hackathon prototype on test networks. Nothing here is financial advice, an offer of credit, or a promise of funds.</p>
        <p>2 · All money is test money (tCTC, Sepolia ETH) with zero real-world value. Never send real assets to any address shown here.</p>
        <p>3 · Demo mode stores everything on your own phone and can be reset anytime. Try-it mode writes to public testnet ledgers that anyone can read and that cannot be deleted.</p>
        <p>4 · Scores, limits, and statements are illustrative reputation mechanics, not bank guarantees. Lenders decide for themselves.</p>
        <p>5 · You must have no criminal record or pending cases, not be sanctioned, and be legally permitted to participate, per the event rules.</p>
        <p>6 · By using the app you agree all submitted information is accurate and yours to share.</p>
      </div>
    </article>
  )
}

function Privacy() {
  return (
    <article aria-labelledby="privacy-h" className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Risiti · hackathon demo</p>
      <h2 id="privacy-h" className="mt-1 text-3xl font-black tracking-tight">Privacy</h2>
      <div className="mt-4 grid gap-4 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
        <p>1 · Demo mode: your name, stalls, receipts, and voices stay in your phone's local storage. Nothing leaves the device. Clearing the demo (or the browser data) erases it.</p>
        <p>2 · Try-it mode: anything you sign goes on public testnet ledgers — wallet addresses, receipts, voices, and transactions are permanently visible to anyone, including via Blockscout. Use a fresh burner wallet.</p>
        <p>3 · No accounts, no passwords, no tracking, no analytics, no cookies for ads. Photos are picked from built-in samples; the app never touches your camera roll unless your browser grants it.</p>
        <p>4 · Contact the team through the hackathon channels listed in the project README.</p>
      </div>
    </article>
  )
}

function MarketStrip({ stalls, onPick }: { stalls: ReturnType<typeof useStalls>['stalls']; onPick: (id: string) => void }) {
  const seen = new Map<string, string>()
  for (const s of stalls) {
    const k = normMarket(s.market)
    if (!seen.has(k)) seen.set(k, s.market.trim())
  }
  const markets = ['All', ...seen.values()]
  const [filter, setFilter] = useState('All')
  const shown = filter === 'All' ? stalls : stalls.filter((s) => normMarket(s.market) === normMarket(filter))
  return (
    <section id="market" aria-labelledby="market-h" className="mx-auto max-w-6xl px-4 pt-4">
      <div className="flex items-end gap-3">
        <span className="tabular rounded-full border-2 border-[var(--color-ink)] px-2.5 py-1 text-[11px] font-black">01</span>
        <h2 id="market-h" className="text-2xl font-black tracking-tight">Today at the market</h2>
      </div>
      <p className="mt-1 text-[13.5px] font-semibold text-[var(--color-muted)]">Whose stall is yours? Tap it · we fill the photo on your receipt.</p>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by market">
        {markets.map((m) => (
          <button key={m} type="button" onClick={() => setFilter(m)} aria-pressed={filter === m}
            className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-black ${filter === m ? 'bg-[#0c0b09] text-white' : 'bg-[var(--color-paper-deep)]'}`}>
            {m}
          </button>
        ))}
      </div>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {shown.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onPick(s.id)}
              className="flex w-full items-center gap-3 bg-[var(--color-card)] p-2 text-left">
              <img src={s.photo} alt={s.name} className="photo-warm h-16 w-16 shrink-0 object-cover" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <img src={s.avatar} alt="" className="h-6 w-6 rounded-full" loading="lazy" />
                  <span className="truncate text-[15px] font-black">{s.name}</span>
                </span>
                <span className="block truncate text-[12.5px] font-semibold text-[var(--color-muted)]">{s.goods} · {s.market}</span>
                <span className="tabular text-[13px] font-black">{s.price}</span>
              </span>
              <span className="shrink-0 rounded-full bg-[#0c0b09] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white">Sell here</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const ONBOARD_KEY = 'risiti.onboarded.v1'

const NAME_KEY = 'risiti.name.v1'

function Onboarding({ onDone }: { onDone: (name: string, stall?: { name: string; market: string; goods: string }) => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [stallName, setStallName] = useState('')
  const [stallMarket, setStallMarket] = useState('')
  const [stallGoods, setStallGoods] = useState('')
  const last = 3
  const finish = () =>
    onDone(
      name.trim(),
      stallName.trim() ? { name: stallName.trim(), market: stallMarket.trim() || 'My market', goods: stallGoods.trim() || 'General goods' } : undefined,
    )
  return (
    <div className="screen-only fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0c0b09]/95 p-5" role="dialog" aria-modal="true" aria-label="Welcome to Risiti">
      <div className="w-full max-w-sm bg-[#faf5ea] p-6 text-center">
        <p className="tabular text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Step {step + 1} of {last + 1}</p>
        {step === 0 && (
          <>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Welcome to Risiti</h2>
            <p className="mt-2 text-[15px] leading-relaxed">Sell exactly as usual. Your customer taps once to confirm · and every confirmed sale builds your standing.</p>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Three sales unlock help</h2>
            <p className="mt-2 text-[15px] leading-relaxed">Confirm a few receipts and your standing grows. Then take a small community advance for 7 days. Zero interest.</p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="mt-2 text-2xl font-black tracking-tight">What should we call you?</h2>
            <p className="mt-2 text-[15px] leading-relaxed">Your name shows on your stall and your receipts.</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name, e.g. Chidi"
              aria-label="Your name" autoComplete="off"
              className="mt-4 min-h-[52px] w-full border border-[var(--color-line)] bg-white px-4 text-[16px] font-semibold" />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Where is your stall?</h2>
            <p className="mt-2 text-[15px] leading-relaxed">Optional · 20 seconds. You can also add it later from Market.</p>
            <input value={stallName} onChange={(e) => setStallName(e.target.value)} placeholder="Stall name, e.g. Mama Ada"
              aria-label="Stall name" autoComplete="off"
              className="mt-4 min-h-[52px] w-full border border-[var(--color-line)] bg-white px-4 text-[16px] font-semibold" />
            <input value={stallMarket} onChange={(e) => setStallMarket(e.target.value)} placeholder="Market · city, e.g. Mile 12 · Lagos"
              aria-label="Market and city" autoComplete="off"
              className="mt-2 min-h-[52px] w-full border border-[var(--color-line)] bg-white px-4 text-[16px] font-semibold" />
            <input value={stallGoods} onChange={(e) => setStallGoods(e.target.value)} placeholder="What you sell, e.g. rice and oil"
              aria-label="What you sell" autoComplete="off"
              className="mt-2 min-h-[52px] w-full border border-[var(--color-line)] bg-white px-4 text-[16px] font-semibold" />
          </>
        )}
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => (step < last ? setStep(step + 1) : finish())}
            className="hard-btn bg-[#ff3c1a] text-base font-black text-white">{step === last ? 'Start' : 'Next'}</button>
          <button type="button" onClick={() => (step === last ? finish() : onDone(name.trim()))} className="min-h-[44px] text-[13px] font-bold text-[var(--color-muted)] underline underline-offset-4">
            {step === last ? 'Skip · add stall later' : 'Skip intro'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BankStatement({ trader, slips, score }: { trader: string; slips: ReturnType<typeof useRisitiStore>['slips']; score: number }) {
  const done = slips.filter((s) => s.confirmed)
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <section className="print-only px-6 py-8" aria-label="Bank statement">
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>Risiti · Trading statement</h1>
      <p>Trader: <strong>{trader || 'You'}</strong> · Date: {date}</p>
      <p>Confirmed sales: <strong>{done.length}</strong> · Standing: <strong>{score}/900</strong></p>
      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th align="left">Receipt</th>
            <th align="left">Buyer</th>
            <th align="left">Goods</th>
            <th align="left">Market</th>
            <th align="right">Amount</th>
            <th align="left">Proof</th>
          </tr>
        </thead>
        <tbody>
          {done.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid #999' }}>
              <td>{s.id}</td>
              <td>{s.buyer}</td>
              <td>{s.goods}</td>
              <td>{s.market}</td>
              <td align="right">{s.amount}</td>
              <td>{s.witnessed ? 'witnessed' : 'confirmed'}{s.attested ? ' + verified top-up' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 16, fontSize: 12 }}>
        Verify on Creditcoin testnet explorer (Blockscout, chain 102031). Each confirmed sale was
        countersigned by its buyer · witnesses are never the trading parties · restock top-ups are
        proven cross-chain through the Attestcoin Protocol.
      </p>
    </section>
  )
}

export default function App() {
  const { mode, setMode, slips, confirm, witness, attest, markVerbal, verbalConfirm, add, reset } = useRisitiStore()
  const { stalls, addStall } = useStalls()
  const { mine: myVoices, addVoice } = useVoices()
  const [screen, setScreen] = useState<Screen>('home')
  const [onboarded, setOnboarded] = useState(() => {
    try {
      return localStorage.getItem(ONBOARD_KEY) === '1'
    } catch {
      return true
    }
  })
  const [trader, setTrader] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) || ''
    } catch {
      return ''
    }
  })
  const go = (s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const doneOnboarding = (name: string, stall?: { name: string; market: string; goods: string }) => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1')
      if (name) {
        localStorage.setItem(NAME_KEY, name)
        setTrader(name)
      }
    } catch {
      /* ignore */
    }
    if (stall) {
      addStall({
        id: `my-${Date.now().toString(36)}`,
        name: stall.name,
        owner: name || 'You',
        market: stall.market,
        avatar: dice(stall.name),
        photo: photoForGoods(stall.goods),
        goods: stall.goods,
        price: 'Varies',
      })
    }
    setOnboarded(true)
  }
  const [form, setForm] = useState({ buyer: 'Musa', goods: '2 bags rice', amount: '420', stall: SEED_STALLS[0].id, ccy: '₦', market: SEED_STALLS[0].market })
  const [pot, setPot] = useState(12.5)
  const [advance, setAdvance] = useState(0)
  const [realAdvance, setRealAdvance] = useState('0')
  const { address: myAddr, isConnected: walletOn } = useAccount()
  const live = mode === 'real' && !!CONTRACTS.pool && walletOn
  const poolAddr = (CONTRACTS.pool || '0x0000000000000000000000000000000000000000') as `0x${string}`
  const { data: chainPot, refetch: refetchPot } = useReadContract({
    address: poolAddr,
    abi: POOL_ABI,
    functionName: 'pot',
    query: { enabled: live },
  })
  const { data: chainLimit } = useReadContract({
    address: (CONTRACTS.registry || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: 'advanceLimit',
    args: myAddr ? [myAddr] : undefined,
    query: { enabled: live && !!myAddr && !!CONTRACTS.registry },
  })
  const { writeContract, data: potTx, status: potTxStatus, error: potTxError } = useWriteContract()
  const { isSuccess: potConfirmed } = useWaitForTransactionReceipt({ hash: potTx })
  const { writeContract: writeBoost, data: boostTx } = useWriteContract()
  const { isSuccess: boostConfirmed } = useWaitForTransactionReceipt({ hash: boostTx })
  const { writeContract: writeRx, data: rxTx, status: rxStatus } = useWriteContract()
  const { isSuccess: rxConfirmed } = useWaitForTransactionReceipt({ hash: rxTx })
  useEffect(() => {
    if (potTxStatus === 'success') refetchPot()
  }, [potTxStatus])
  const chainLimitTctc = typeof chainLimit === 'bigint' ? Number(formatEther(chainLimit)) : null
  const chainPotTctc = typeof chainPot === 'bigint' ? Number(formatEther(chainPot)) : null
  const [sepoliaTx, setSepoliaTx] = useState('')
  const [proof, setProof] = useState<AttestState>({ status: 'idle' })
  const t = useMemo(() => trustFromSlips(slips, trader ? [trader] : []), [slips, trader])
  const postVoice = (v: { who: string; trade: string; quote: string }) => {
    addVoice(v)
    if (live && CONTRACTS.registry) {
      writeContract({
        address: CONTRACTS.registry as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'addVoice',
        args: [v.trade.slice(0, 40), v.quote.slice(0, 280)],
      })
    }
  }
  const [chainSlips, setChainSlips] = useState<ChainSlip[] | null>(null)
  const [chainVoices, setChainVoices] = useState<ChainVoice[]>([])
  const [chainScore, setChainScore] = useState<{ score: number; count: number } | null>(null)
  const [chainLoading, setChainLoading] = useState(false)
  const refreshChain = async () => {
    if (!CONTRACTS.registry) return
    setChainLoading(true)
    try {
      const feed = await import('./lib/chainfeed')
      const reg = CONTRACTS.registry as `0x${string}`
      const [s, v] = await Promise.all([feed.getChainSlips(reg), feed.getChainVoices(reg)])
      setChainSlips(s)
      setChainVoices(v)
      if (myAddr) setChainScore(await feed.getChainScore(reg, myAddr))
    } catch {
      /* keep last good state */
    } finally {
      setChainLoading(false)
    }
  }
  useEffect(() => {
    if (live) refreshChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])
  const [rxMsg, setRxMsg] = useState('')
  useEffect(() => {
    if (rxConfirmed) {
      refreshChain()
      setRxMsg('Confirmed on-chain · see it in the Live Ledger below.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rxConfirmed])
  useEffect(() => {
    if (boostConfirmed) {
      refreshChain()
      setProof({
        status: 'verified',
        txHash: sepoliaTx,
        blockNumber: 0,
        proofHash: 'registry-linked',
        explorer: 'https://creditcoin-testnet.blockscout.com/',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boostConfirmed])
  useEffect(() => {
    if (potConfirmed) {
      refetchPot()
      refreshChain()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potConfirmed])

  const [formError, setFormError] = useState('')
  const [kind, setKind] = useState<'sale' | 'stock'>('sale')
  const [shared, setShared] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [buyerCode, setBuyerCode] = useState('')
  const [buyerMsg, setBuyerMsg] = useState('')
  const [billPage, setBillPage] = useState(0)
  useEffect(() => { setBillPage(0) }, [slips.length])
  useEffect(() => {
    if (!revealed) return
    const t = setTimeout(() => setRevealed(null), 20000)
    return () => clearTimeout(t)
  }, [revealed])
  const savingRef = useRef(false)
  const [saving, setSaving] = useState(false)

  const newSlip = () => {
    if (savingRef.current) return
    const stall = stalls.find((s) => s.id === form.stall) ?? stalls[0]
    const me = trader || 'You'
    if (live) {
      const buyer = form.buyer.trim()
      if (!/^0x[0-9a-fA-F]{40}$/.test(buyer)) {
        setFormError('Try-it needs the buyer wallet address · a 0x… address, not a name.')
        return
      }
      if (buyer.toLowerCase() === (myAddr ?? '').toLowerCase()) {
        setFormError('You cannot sell to yourself · use the real buyer wallet.')
        return
      }
      const amt = Number(form.amount)
      if (!Number.isFinite(amt) || amt <= 0 || amt > 1000) {
        setFormError('Amount must be a number between 0 and 1000 tCTC.')
        return
      }
      if (!CONTRACTS.registry) {
        setFormError('Registry not configured.')
        return
      }
      setFormError('')
      setRxMsg('Check your wallet · opening the receipt on-chain…')
      writeRx({
        address: CONTRACTS.registry as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'openRisiti',
        args: [buyer as `0x${string}`, parseEther(String(amt)), `${form.goods || 'Market sale'} · ${form.market}`, stall.photo],
      })
      return
    }
    const other = form.buyer.trim() || (kind === 'sale' ? 'Musa' : 'Supplier')
    const sameName = other.toLowerCase() === me.toLowerCase()
    setFormError('')
    savingRef.current = true
    setSaving(true)
    const ksh = Math.max(1, Math.round(Number(form.amount || '100')))
    const rid = newSlipId()
    const seller = kind === 'sale' ? me : other
    const buyer = kind === 'sale' ? other : me
    add({
      id: rid,
      seller,
      sellerAvatar: dice(`${seller}-trader-${rid}`),
      buyer,
      buyerAvatar: dice(`${buyer}-trader-${rid}`),
      goods: form.goods || (kind === 'sale' ? 'Market sale' : 'Stock purchase'),
      photo: stall.photo,
      amount: `${form.ccy} ${ksh}`,
      amountNum: ksh / 1000,
      ccy: form.ccy,
      market: form.market,
      verbal: false,
      sameName,
      confirmed: false,
      witnessed: false,
      attested: false,
      createdAgo: 'just now',
    })
    go('receipts')
    setSaving(false)
    savingRef.current = false
  }

  return (
    <div id="top" className="flex min-h-screen flex-col pb-24 sm:pb-0">
      {!onboarded && <Onboarding onDone={doneOnboarding} />}
      <TopBar mode={mode} setMode={setMode} screen={screen} setScreen={go} trader={trader} />
      {screen === 'home' && <Hero onNew={() => go('new')} mode={mode} onGo={go} amina={sellerStats(slips, 'Amina')} totalSales={slips.filter((s) => s.confirmed).length} />}

      <main className="screen-only ledger-bg w-full flex-1 space-y-0 pb-8 pt-5 sm:pb-12 sm:pt-8 [&>section]:border-t [&>section]:border-[var(--color-line)]">
        {screen === 'paper' && <Whitepaper />}
        {screen === 'terms' && <Terms />}
        {screen === 'privacy' && <Privacy />}
        {screen === 'home' && <TierCards onGo={go} />}
        {(screen === 'home' || screen === 'market') && <MarketStrip stalls={stalls} onPick={(id) => { const st = stalls.find((x) => x.id === id) ?? stalls[0]; setKind('sale'); setForm((f) => ({ ...f, stall: id, market: st.market })); go('new') }} />}
        {screen === 'market' && <AddStallForm trader={trader} ccy={form.ccy} onAdd={(s) => { addStall(s); setForm((f) => ({ ...f, stall: s.id, market: s.market })); go('new') }} />}
        {screen === 'home' && <TradersVoices slips={slips} extras={myVoices} chain={chainVoices} trader={trader} live={live} onAdd={postVoice} />}

        {/* CREATE · one screen, one job */}
        {screen === 'new' && (
        <section id="create" aria-labelledby="create-h" className="ink-card mx-auto max-w-6xl scroll-mt-24 px-4 py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">02 · Your turn</p>
          <h2 id="create-h" className="mt-1 text-2xl font-black tracking-tight">New receipt</h2>
          <div className="mt-2 flex gap-2" role="group" aria-label="Receipt type">
            <button type="button" onClick={() => setKind('sale')} aria-pressed={kind === 'sale'}
              className={`min-h-[44px] flex-1 text-[13.5px] font-black sm:flex-none sm:px-5 ${kind === 'sale' ? 'bg-[#0c0b09] text-white' : 'bg-[var(--color-paper-deep)]'}`}>
              I sold
            </button>
            <button type="button" onClick={() => setKind('stock')} aria-pressed={kind === 'stock'}
              className={`min-h-[44px] flex-1 text-[13.5px] font-black sm:flex-none sm:px-5 ${kind === 'stock' ? 'bg-[#0c0b09] text-white' : 'bg-[var(--color-paper-deep)]'}`}>
              I restocked
            </button>
          </div>
          <p className="mt-1 text-[14px] text-[var(--color-muted)]">Three quick answers. Nothing else.</p>
          <div className="mx-auto mt-4 grid w-full max-w-2xl gap-3.5">
          <div className="grid content-start gap-3.5">
            <div>
              <label htmlFor="buyer" className="text-[13px] font-black uppercase tracking-widest">{live ? 'Buyer wallet (0x…)' : kind === 'sale' ? '1 · Who bought?' : '1 · Who sold to you?'}</label>
              <input id="buyer" value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })}
                className="mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[17px] font-semibold outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" placeholder={live ? '0x…' : kind === 'sale' ? 'Musa' : 'Supplier name'} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="goods" className="text-[13px] font-black uppercase tracking-widest">2 · What {kind === 'sale' ? 'did they take?' : 'did you bring in?'}</label>
              <input id="goods" value={form.goods} onChange={(e) => setForm({ ...form, goods: e.target.value })}
                className="mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[17px] font-semibold outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" placeholder={kind === 'sale' ? '2 bags rice' : 'e.g. 1 bag fertilizer'} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="amount" className="text-[13px] font-black uppercase tracking-widest">3 · How much{live ? ' (tCTC)' : ''}?</label>
              {!live && (
              <div className="mt-1.5 flex max-w-md gap-1.5" role="group" aria-label="Currency">
                {CURRENCIES.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, ccy: c })} aria-pressed={form.ccy === c}
                    className={`min-h-[44px] min-w-[44px] px-2 text-[15px] font-black ${form.ccy === c ? 'bg-[#0c0b09] text-white' : 'bg-[var(--color-paper-deep)]'}`}>
                    {c}
                  </button>
                ))}
              </div>
              )}
              <input id="amount" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="tabular mt-1 w-full border-0 border-b-2 border-[var(--color-ink)] bg-transparent px-1 py-3 text-[20px] font-black outline-none placeholder:text-[var(--color-muted)]/60 focus:border-[#ff3c1a]" placeholder="420" />
            </div>
            </div>
            <div>
              <img
                src={(stalls.find((s) => s.id === form.stall) ?? stalls[0]).photo}
                alt="Selected stall goods"
                className="photo-warm h-40 w-full object-cover sm:h-52"
                loading="lazy"
              />
              <fieldset className="mt-3">
                <legend className="text-[13px] font-black uppercase tracking-widest">Pick the closest photo · no camera needed</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {stalls.map((s) => (
                    <button key={s.id} type="button" onClick={() => setForm({ ...form, stall: s.id })}
                      aria-pressed={form.stall === s.id}
                      className={`relative overflow-hidden text-left ${form.stall === s.id ? 'ring-4 ring-[#ff3c1a]' : ''}`}>
                      <img src={s.photo} alt={s.name} className="photo-warm h-20 w-full object-cover" loading="lazy" />
                      <span className="block bg-[#0c0b09] px-2 py-1.5 text-[12px] font-black text-white">{kind === 'stock' ? s.goods : s.name}{form.stall === s.id ? ' · picked' : ''}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
          <button type="button" onClick={newSlip} disabled={saving} className="hard-btn mt-4 w-full bg-[#ff3c1a] text-lg font-black text-white sm:w-auto sm:px-8">
            {saving ? 'Saving…' : 'Save receipt'}
          </button>
          {formError ? <p role="alert" className="mt-2 text-[13.5px] font-bold text-[var(--color-stamp)]">{formError}</p> : null}
          {rxMsg ? <p role="status" className="mt-2 text-[13.5px] font-bold text-[var(--color-leaf)]">{rxMsg}</p> : null}
          <p className="mt-2 text-[12.5px] font-semibold text-[var(--color-muted)]">{kind === 'sale' ? `Market: ${form.market} · set from the stall you picked.` : `Bought at: ${form.market} · goods going into your stall.`}</p>
        </section>
        )}

        {/* RECEIPTS · one screen, one job */}
        {['receipts'].includes(screen) && (
        <>
        <PoolTable slips={slips} pot={pot} live={live} chain={chainSlips} loading={chainLoading} onRefresh={refreshChain}
          myAddr={myAddr} busy={rxStatus === 'pending'}
          onConfirm={(n) => { setRxMsg('Check your wallet · confirming on-chain…'); writeRx({ address: CONTRACTS.registry as `0x${string}`, abi: REGISTRY_ABI, functionName: 'confirmRisiti', args: [n] }) }}
          onWitness={(n) => { setRxMsg('Check your wallet · co-signing on-chain…'); writeRx({ address: CONTRACTS.registry as `0x${string}`, abi: REGISTRY_ABI, functionName: 'witnessRisiti', args: [n] }) }} />
        {rxMsg && screen === 'receipts' ? <p role="status" className="mx-auto max-w-6xl px-4 pt-1 text-[13.5px] font-bold text-[var(--color-leaf)]">{rxMsg}</p> : null}
        <section id="ledger" aria-labelledby="ledger-h" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">03 · They confirm</p>
          <div className="mt-1 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-7 w-7" aria-hidden />
            <h2 id="ledger-h" className="text-2xl font-black tracking-tight">Receipts</h2>
            <span className="tabular ml-auto rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-card)] px-3 py-1 text-[13px] font-black">
              {slips.filter((s) => s.confirmed).length}/{slips.length} confirmed
            </span>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-[var(--color-muted)]">Every receipt is public · only the named buyer can confirm it.</p>
          {live && (
            <p className="mt-2 bg-[#0c0b09] p-3 text-[13px] font-bold text-white">Try-it shows two ledgers · the on-chain table above is truth, the cards below are this phone's demo practice. They never mix.</p>
          )}
          <div className="mt-3 bg-[#0c0b09] p-4 text-white">
            <p className="text-[13px] font-black uppercase tracking-widest">Buying? Got a code</p>
            <p className="mt-0.5 text-[13px] text-white/70">Enter the seller's 6-letter code · one tap confirms.</p>
            <div className="mt-2 flex gap-2">
              <input value={buyerCode} onChange={(e) => { setBuyerCode(e.target.value.toUpperCase()); setBuyerMsg('') }}
                placeholder="e.g. X7K2P9" aria-label="Buyer confirm code" autoComplete="off" maxLength={6}
                className="tabular min-h-[48px] w-full bg-white px-4 text-[16px] font-black tracking-[0.2em] text-black outline-none" />
              <button type="button" onClick={() => {
                const found = slips.find((x) => confirmCode(x.id) === buyerCode.trim())
                if (!found) { setBuyerMsg('No receipt with that code · check the letters.'); return }
                if (found.confirmed) { setBuyerMsg('Already confirmed · asante.'); return }
                confirm(found.id)
                setBuyerMsg(`Confirmed ${found.amount} from ${found.seller}. Asante!`)
                setBuyerCode('')
              }} className="min-h-[48px] shrink-0 bg-[#ff3c1a] px-5 text-[14px] font-black text-white">
                Confirm
              </button>
            </div>
            {buyerMsg ? <p role="status" className="mt-2 text-[13.5px] font-bold">{buyerMsg}</p> : null}
          </div>
          {slips.length === 0 && (
            <div role="status" className="ink-card-flat mt-4 rounded-3xl p-8 text-center">
              <p className="text-lg font-black">No receipts yet · you're early.</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Start one from the New tab. It takes 10 seconds.</p>
            </div>
          )}
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {slips.slice(billPage * 4, billPage * 4 + 4).map((s) => (
              <motion.li key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ink-card overflow-hidden rounded-3xl">
                <div className="relative">
                  <img src={s.photo} alt="" className="photo-warm h-44 w-full object-cover sm:h-40" loading="lazy" />
                  {s.confirmed && <span className="stamp-seal absolute right-3 top-3 rounded-lg bg-[var(--color-card)] px-2.5 py-1 text-[11px] font-black">Confirmed</span>}
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <img src={s.sellerAvatar} alt={`${s.seller}`} className="h-11 w-11 rounded-full border-2 border-[var(--color-ink)]" />
                    <div className="leading-tight">
                      <p className="text-[15px] font-black">{s.seller} → {s.buyer}</p>
                      <p className="text-[12.5px] font-semibold text-[var(--color-muted)]">{s.goods} · {s.market} · {s.createdAgo}{s.sameName && !s.witnessed ? ' · same name: needs a witness to count' : ''}</p>
                    </div>
                    <span className="tabular ml-auto text-[15px] font-black">{s.amount}</span>
                  </div>
                  {!s.confirmed ? (
                    s.verbal ? (
                      <div className="mt-4">
                        <p className="bg-[#0c0b09] p-3 text-center text-[13px] font-bold text-white">No-phone sale · a neighbour confirms for {s.buyer}.</p>
                        {((trader || 'You') === s.seller || (trader || 'You') === s.buyer) ? (
                          <p className="mt-2 px-1 text-[13px] font-bold text-[var(--color-muted)]">Parties can't sign · hand the phone to a neighbour.</p>
                        ) : (
                          <button type="button" onClick={() => verbalConfirm(s.id)} className="hard-btn mt-2 w-full bg-[var(--color-leaf)] text-[15px] font-black text-white">
                            Confirm for {s.buyer} · I saw it
                          </button>
                        )}
                      </div>
                    ) : (
                    <div className="mt-4">
                      <button type="button" onClick={() => { setShared(shared === s.id ? null : s.id); setRevealed(null); setCopied(false) }}
                        aria-expanded={shared === s.id}
                        className="hard-btn w-full bg-[var(--color-leaf)] text-[15px] font-black text-white">
                        {shared === s.id ? 'Hide buyer code' : `Send to ${s.buyer} · 1 tap`}
                      </button>
                      {shared === s.id && (
                        <div className="mt-2 bg-[#0c0b09] p-4 text-center text-white">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">{s.buyer}'s code · only share with {s.buyer}</p>
                          {revealed === s.id ? (
                            <>
                              <p className="tabular mt-1 text-4xl font-black tracking-[0.18em]">{confirmCode(s.id)}</p>
                              <p className="mt-1 text-[12.5px] text-white/70">{s.amount} · {s.goods} · hides in 20s</p>
                            </>
                          ) : (
                            <>
                              <p className="tabular mt-1 text-4xl font-black tracking-[0.18em] text-white/30">••••••</p>
                              <button type="button" onClick={() => setRevealed(s.id)}
                                className="mt-1 min-h-[44px] px-4 text-[13px] font-black text-white underline underline-offset-4">
                                Tap to reveal
                              </button>
                            </>
                          )}
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={async () => {
                              const text = `Confirm my ${s.amount} receipt on Risiti with code ${confirmCode(s.id)}`
                              try {
                                await navigator.clipboard.writeText(text)
                                setCopied(true)
                              } catch {
                                setCopied(false)
                              }
                            }} className="min-h-[46px] flex-1 bg-white text-[13.5px] font-black text-black">
                              {copied ? 'Copied!' : 'Copy message'}
                            </button>
                            <a href={`https://wa.me/?text=${encodeURIComponent(`Confirm my ${s.amount} receipt on Risiti with code ${confirmCode(s.id)} · open Risiti, Bills, enter the code.`)}`}
                              target="_blank" rel="noreferrer"
                              className="grid min-h-[46px] flex-1 place-items-center text-[13.5px] font-black text-white ring-1 ring-white/40">
                              WhatsApp it
                            </a>
                          </div>
                          <button type="button" onClick={() => { confirm(s.id); setShared(null); setRevealed(null) }}
                            className="mt-2 min-h-[40px] text-[12px] font-bold text-white/60 underline underline-offset-4">
                            Demo shortcut · confirm now
                          </button>
                        </div>
                      )}
                      <button type="button" onClick={() => markVerbal(s.id)}
                        className="mt-2 min-h-[40px] text-[12.5px] font-bold text-[var(--color-muted)] underline underline-offset-4">
                        {s.buyer} has no phone? A neighbour can stand in.
                      </button>
                    </div>
                  ))
                  : (
                    <p className="mt-3 flex items-center gap-1.5 rounded-2xl bg-[var(--color-leaf)]/10 px-3 py-2.5 text-[13.5px] font-bold text-[var(--color-leaf)]">
                      <CheckBadgeIcon className="h-5 w-5 shrink-0" aria-hidden /> {s.buyer} confirmed. Thank you!
                      {s.witnessed ? ' · witnessed' : ''}
                      {s.attested ? ' · top-up verified' : ''}
                    </p>
                  )}
                  {s.confirmed && !s.witnessed && ((trader || 'You') === s.seller || (trader || 'You') === s.buyer ? (
                    <p className="mt-2.5 px-1 text-[13px] font-bold text-[var(--color-muted)]">Waiting for a neighbour to co-sign · parties never sign their own receipt.</p>
                  ) : (
                    <button type="button" onClick={() => witness(s.id)} className="mt-2.5 min-h-[48px] w-full border-2 border-[var(--color-ink)] bg-white text-[14px] font-black">
                      Co-sign as neighbour
                    </button>
                  ))}
                </div>
              </motion.li>
            ))}
          </ul>
          {Math.ceil(slips.length / 4) > 1 && (
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => setBillPage((p) => Math.max(0, p - 1))} disabled={billPage === 0}
                className="min-h-[44px] px-4 text-[13px] font-black disabled:opacity-40">← Newer</button>
              <span className="tabular text-[12px] font-bold text-[var(--color-muted)]">Page {billPage + 1} of {Math.ceil(slips.length / 4)}</span>
              <button type="button" onClick={() => setBillPage((p) => Math.min(Math.ceil(slips.length / 4) - 1, p + 1))} disabled={billPage >= Math.ceil(slips.length / 4) - 1}
                className="min-h-[44px] px-4 text-[13px] font-black disabled:opacity-40">Older →</button>
            </div>
          )}
          <button type="button" onClick={reset} className="mt-3 min-h-[44px] text-[13px] font-bold text-[var(--color-muted)] underline underline-offset-4">
            Reset demo receipts
          </button>
        </section>
        </>
        )}

        {/* SCORE + TOP-UP + MORE · one screen, one job */}
        {screen === 'score' && (
        <section id="score" aria-labelledby="score-h" className="mx-auto grid max-w-6xl scroll-mt-24 gap-4 px-4 py-6 md:grid-cols-2">
          <div className="ink-card rounded-3xl p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">04 · Standing grows</p>
            <div className="mt-1 flex items-center gap-2">
              <SparklesIcon className="h-7 w-7" aria-hidden />
              <h2 id="score-h" className="text-2xl font-black tracking-tight">Your standing</h2>
            </div>
            {live ? (
              <>
                <p className="tabular mt-3 text-5xl font-black">{chainScore ? chainScore.score : '…' }<span className="text-lg text-[var(--color-muted)]">/900</span></p>
                <p className="mt-2 text-[14.5px] leading-relaxed">
                  {chainScore ? (
                    <><strong>{chainScore.count} on-chain sales</strong> · read live from the Registry for {myAddr ? shortHash(myAddr) : 'your wallet'}. Demo receipts below never touch this number.</>
                  ) : (
                    <>Reading the chain…</>
                  )}
                </p>
                <p className="tabular mt-3 text-[12px] font-bold text-[var(--color-muted)]">
                  Limit {chainLimitTctc !== null ? `${chainLimitTctc.toFixed(1)} tCTC` : '…'} · {myAddr ? shortHash(myAddr) : ''}
                </p>
              </>
            ) : (
            <>
            {(() => {
              const steps = [2, 4, 8, 12]
              const next = steps.find((m) => t.count < m) ?? 0
              return (
                <>
                  <div className="mt-4 flex items-center gap-1.5" role="img" aria-label={`${t.count} of ${next || 12} sales confirmed`}>
                    {Array.from({ length: next || 12 }).map((_, i) => (
                      <span key={i} className={`h-3.5 flex-1 ${i < t.count ? 'bg-[var(--color-leaf)]' : 'bg-[var(--color-paper-deep)]'}`} />
                    ))}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed">
                    {next ? (
                      <><strong>{t.count} of {next} sales.</strong> {next - t.count} more confirmed sale{next - t.count === 1 ? '' : 's'} unlocks <strong>{next <= 2 ? 'your first advance' : `a bigger advance`}</strong>.</>
                    ) : (
                      <><strong>Top standing.</strong> You can take <strong>{t.limit.toFixed(1)} tCTC</strong> for 7 days, free.{t.attested === 0 ? ' Top tier unlocks fully after 1 verified restock · see Boost below.' : ''}</>
                    )}
                  </p>
                </>
              )
            })()}
            <p className="tabular mt-3 text-[12px] font-bold text-[var(--color-muted)]">Standing {t.score}/900 · {t.witnessed} co-signs · {t.attested} verified top-ups · demo phone only</p>
            <button type="button" onClick={() => window.print()} className="mt-3 min-h-[48px] w-full bg-[#0c0b09] text-[14px] font-black text-white sm:w-auto sm:px-6">
              Get bank statement
            </button>
            </>
            )}
          </div>
          <div className="ink-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-7 w-7" aria-hidden />
              <h2 className="text-2xl font-black tracking-tight">Community pot</h2>
            </div>
            {live ? (
              <p className="tabular mt-2 text-[15px] font-bold">
                Pot: {chainPotTctc !== null ? chainPotTctc.toFixed(2) : '…'} tCTC on-chain · Limit: {chainLimitTctc !== null ? chainLimitTctc.toFixed(1) : '…'} tCTC · Holding: {realAdvance} tCTC
              </p>
            ) : (
              <>
                <p className="tabular mt-2 text-[15px] font-bold">Pot: {pot.toFixed(2)} tCTC · You can take: {t.limit.toFixed(1)} tCTC · Holding: {advance.toFixed(2)} tCTC</p>
                <p className="mt-1 text-[12px] font-semibold text-[var(--color-muted)]">Sales show your currency. Advances pay out in tCTC on the testnet.</p>
              </>
            )}
            {mode === 'real' && !walletOn && (
              <p className="mt-2 text-[13px] font-bold text-[var(--color-stamp)]">Connect wallet in the header above · the pot only moves with your signature.</p>
            )}
            <button type="button" onClick={() => {
              if (live) {
                const lim = chainLimitTctc ?? 0
                const amt = Math.min(lim, 1)
                if (lim <= 0 || (chainPotTctc ?? 0) < amt) return
                setRealAdvance(String(amt))
                writeContract({ address: CONTRACTS.pool as `0x${string}`, abi: POOL_ABI, functionName: 'draw', args: [parseEther(String(amt))] })
                return
              }
              const amt = Math.min(t.limit, 1)
              if (t.limit <= 0 || pot < amt) return
              setPot((p) => +(p - amt).toFixed(2))
              setAdvance(amt)
            }}
              disabled={live ? (chainLimitTctc ?? 0) <= 0 : t.limit <= 0} className="hard-btn mt-4 w-full rounded-2xl bg-[var(--color-warm)] text-[15px] font-black text-white">
              {live
                ? ((chainLimitTctc ?? 0) <= 0
                  ? 'No on-chain limit yet · build receipts first'
                  : ((chainPotTctc ?? 0) < Math.min(chainLimitTctc ?? 0, 1)
                    ? 'Pot is empty · add funds first'
                    : `Draw ${Math.min(chainLimitTctc ?? 0, 1)} tCTC on-chain`))
                : (t.limit <= 0 ? 'Confirm 2 receipts to unlock' : 'Take 7-day advance · no interest')}
            </button>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={() => {
                if (live) {
                  if (realAdvance === '0') return
                  writeContract({ address: CONTRACTS.pool as `0x${string}`, abi: POOL_ABI, functionName: 'repay', value: parseEther(realAdvance) })
                  setRealAdvance('0')
                } else {
                  setPot((p) => +(p + advance).toFixed(2))
                  setAdvance(0)
                }
              }} disabled={live ? realAdvance === '0' : advance <= 0}
                className="min-h-[48px] flex-1 rounded-2xl border-2 border-[var(--color-ink)] bg-white text-[14px] font-black">Pay back</button>
              <button type="button" onClick={() => {
                if (live) {
                  writeContract({ address: CONTRACTS.pool as `0x${string}`, abi: POOL_ABI, functionName: 'fund', value: parseEther('0.1') })
                } else {
                  setPot((p) => +(p + 1).toFixed(2))
                }
              }}
                className="min-h-[48px] flex-1 rounded-2xl border-2 border-[var(--color-ink)] bg-white text-[14px] font-black">{live ? 'Add 0.1 tCTC' : 'Add 1 to pot'}</button>
            </div>
            {live && potTxStatus === 'pending' && <p role="status" className="mt-2 text-[13px] font-bold">Check your wallet · confirm the transaction…</p>}
            {live && potTxStatus === 'success' && !potConfirmed && <p role="status" className="mt-2 text-[13px] font-bold">Sent · waiting for the chain to confirm…</p>}
            {live && potConfirmed && potTx && (
              <p className="mt-2 text-[13px] font-bold text-[var(--color-leaf)]">Confirmed · pot updated · <a className="underline" href={`https://creditcoin-testnet.blockscout.com/tx/${potTx}`} target="_blank" rel="noreferrer">see it on Blockscout</a></p>
            )}
            {live && potTxStatus === 'error' && (
              <p role="alert" className="mt-2 text-[13px] font-bold text-[var(--color-stamp)]">
                {(() => {
                  const m = (potTxError as Error | null)?.message ?? ''
                  if (/rejected|denied|cancelled/i.test(m)) return 'You declined in the wallet · nothing moved.'
                  if (/insufficient|balance|funds/i.test(m)) return 'Not enough tCTC in this wallet · faucet first, then retry.'
                  if (m) return `Needs a look · ${m.slice(0, 120)}`
                  return 'Failed on-chain · usually an empty pot. Fund it first, then retry.'
                })()}
              </p>
            )}
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-muted)]">Neighbours fund the pot together · like chama, ajo, esusu. Pay back within 7 days and your standing keeps climbing.</p>
          </div>
        </section>
        )}

        {/* TOP-UP · human words, tech behind details */}
        {screen === 'score' && (
        <section id="restock" aria-labelledby="restock-h" className="ink-card mx-auto max-w-6xl scroll-mt-24 px-4 py-6">
          <h2 id="restock-h" className="text-2xl font-black tracking-tight">Boost your standing</h2>
          <p className="mt-1 max-w-2xl text-[14.5px] leading-relaxed text-[var(--color-muted)]">
            Restocked? Paste the payment code · verified stock counts like two extra sales. Supplier payments only.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label htmlFor="sepolia-tx" className="text-[13px] font-black uppercase tracking-widest">Payment code from your transfer</label>
              <input id="sepolia-tx" value={sepoliaTx} onChange={(e) => setSepoliaTx(e.target.value.trim())}
                placeholder="Long code starting with 0x"
                className="tabular mt-1.5 min-h-[52px] w-full rounded-2xl border-2 border-[var(--color-ink)] bg-white px-4 text-[15px]" />
            </div>
            <button type="button"
              onClick={async () => {
                if (!sepoliaTx) return
                setProof({ status: 'checking', step: 'Loading verifier…' })
                const { proveSepoliaRestock } = await import('./lib/attest')
                const r = await proveSepoliaRestock(sepoliaTx, setProof)
                if (!r) return
                if (live && myAddr && CONTRACTS.registry) {
                  setProof({ status: 'verifying', step: 'Proof checks out · submitting to the Registry…' })
                  writeBoost({
                    address: CONTRACTS.registry as `0x${string}`,
                    abi: REGISTRY_ABI,
                    functionName: 'linkRestockProof',
                    args: [
                      myAddr,
                      BigInt(r.chainKey),
                      BigInt(r.headerNumber),
                      r.txBytes as `0x${string}`,
                      r.merkleProof as never,
                      r.continuityProof as never,
                      keccak256(sepoliaTx as `0x${string}`),
                    ],
                  })
                  return
                }
                setProof({ status: 'verified', txHash: sepoliaTx, blockNumber: r.blockNumber, proofHash: `${r.chainKey}:${r.headerNumber}`, explorer: 'https://creditcoin-testnet.blockscout.com/' })
                attest(slips.find((s) => !s.attested)?.id ?? '')
              }}
              className="hard-btn min-h-[52px] self-end bg-[var(--color-ctc)] px-6 text-[15px] font-black text-white sm:whitespace-nowrap">
              Verify · boost +2
            </button>
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold text-[var(--color-muted)]">Where the code lives: MetaMask → Activity → your transfer → copy the 0x hash.</p>
          <div className="mt-3 text-[14px] font-semibold" role="status" aria-live="polite">
            {proof.status === 'idle' && <span className="text-[var(--color-muted)]">Paid with crypto? Paste the code above. Paid cash or transfer?</span>}
            {(proof.status === 'checking' || proof.status === 'waiting' || proof.status === 'proving' || proof.status === 'verifying') && (
              <span className="inline-flex items-center gap-2"><ClockIcon className="h-5 w-5" aria-hidden />{proof.step}</span>
            )}
            {proof.status === 'verified' && (
              <span className="inline-flex flex-wrap items-center gap-2 text-[var(--color-leaf)]">
                <ShieldCheckIcon className="h-5 w-5" aria-hidden /> Verified · your standing just grew.
              </span>
            )}
            {proof.status === 'failed' && <span className="text-[var(--color-stamp)]">Hmm · {proof.error}</span>}
          </div>
          <button type="button" onClick={() => { setKind('stock'); setForm((f) => ({ ...f, goods: 'Stock from supplier' })); go('new') }}
            className="mt-2 min-h-[48px] w-full border border-[var(--color-ink)] bg-white px-4 text-[14px] font-black sm:w-auto">
            Paid cash or transfer? Record it as a supplier receipt instead
          </button>
          <details className="mt-4 border-t border-[var(--color-line)] pt-3 text-[13px]">
            <summary className="cursor-pointer font-black">How does the check work?</summary>
            <p className="mt-2 leading-relaxed text-[var(--color-muted)]">
              We find your payment on Sepolia, wait until Creditcoin confirms that block (about 9 minutes),
              then verify the proof on-chain. A verified top-up counts like two extra sales.
              Watch it happen on the <a className="underline" href={ATTEST.dashboard} target="_blank" rel="noreferrer">network dashboard</a>.
            </p>
          </details>
        </section>
        )}
        {screen === 'score' && <TradersVoices slips={slips} extras={myVoices} chain={chainVoices} trader={trader} live={live} onAdd={postVoice} />}

        {/* HOME · why it matters */}
        {screen === 'home' && (
        <section aria-labelledby="why-h" className="mx-auto grid max-w-6xl gap-2 px-4 py-4 md:grid-cols-3">
          <div className="ink-card-flat p-4">
            <h2 id="why-h" className="text-lg font-black tracking-tight">The problem is not money. It is proof.</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
              Banks ask for history traders never had. From Lagos to Nairobi to Accra, every market runs
              on the same trust: a sale and a neighbour's nod. Risiti turns that trust into on-chain standing.
            </p>
          </div>
          <div className="ink-card-flat flex flex-col p-4">
            <h2 className="text-lg font-black tracking-tight">Traction you can tap</h2>
            <dl className="tabular mt-1.5 grid flex-1 grid-cols-3 content-center gap-1.5 text-center">
              <div className="rounded-lg bg-[var(--color-paper-deep)] px-1 py-1.5 text-[13px] font-black leading-tight">8 stalls<dd className="text-[10.5px] font-bold leading-tight text-[var(--color-muted)]">seeded</dd></div>
              <div className="rounded-lg bg-[var(--color-paper-deep)] px-1 py-1.5 text-[13px] font-black leading-tight">90 sec<dd className="text-[10.5px] font-bold leading-tight text-[var(--color-muted)]">full loop</dd></div>
              <div className="rounded-lg bg-[var(--color-paper-deep)] px-1 py-1.5 text-[13px] font-black leading-tight">3 chains<dd className="text-[10.5px] font-bold leading-tight text-[var(--color-muted)]">touched</dd></div>
            </dl>
            <p className="mt-2 text-[12.5px] font-semibold leading-snug text-[var(--color-muted)]">Real stalls, real taps. Every number here runs live on this phone, no slides.</p>
          </div>
          <div className="ink-card-flat p-4">
            <h2 className="text-lg font-black tracking-tight">Roadmap to real world</h2>
            <ol className="mt-1.5 space-y-1 text-[13.5px] font-semibold text-[var(--color-muted)]">
              <li><strong className="text-[var(--color-ink)]">Live now:</strong> on-chain receipts, buyer codes, community pot, restock proofs</li>
              <li><strong className="text-[var(--color-ink)]">Next:</strong> SMS confirm codes, cooperative pots per market, lender dashboard</li>
              <li><strong className="text-[var(--color-ink)]">With CEIP:</strong> CertiK audit, mainnet launch, bank API for statements</li>
            </ol>
          </div>
        </section>
        )}
        {/* HOME · more: questions + why */}
        {screen === 'home' && (
        <>
        <section aria-label="Questions" className="ink-card-flat mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-lg font-black tracking-tight">Questions, answered plainly</h2>
          <div className="mt-2 grid gap-2 text-[13.5px] md:grid-cols-2">
            <details className="rounded-2xl border border-[var(--color-line)] bg-white p-3.5"><summary className="cursor-pointer font-black">Do I need crypto to start?</summary><p className="mt-1.5 text-[var(--color-muted)]">No. Demo mode runs on your phone with one tap. Crypto only matters for the verified top-up.</p></details>
            <details className="rounded-2xl border border-[var(--color-line)] bg-white p-3.5"><summary className="cursor-pointer font-black">What does the buyer do?</summary><p className="mt-1.5 text-[var(--color-muted)]">One tap: confirm. They type the 6-letter code you sent them · no account, no wallet, 10 seconds.</p></details>
            <details className="rounded-2xl border border-[var(--color-line)] bg-white p-3.5"><summary className="cursor-pointer font-black">What if my buyer has no phone?</summary><p className="mt-1.5 text-[var(--color-muted)]">Mark the sale no-phone on the receipt. A neighbour then confirms for them · parties never sign their own receipt.</p></details>
            <details className="rounded-2xl border border-[var(--color-line)] bg-white p-3.5"><summary className="cursor-pointer font-black">Where does the advance come from?</summary><p className="mt-1.5 text-[var(--color-muted)]">Neighbours fund one pot together, like chama/ajo/esusu. Zero interest, 7 days, reputation-gated.</p></details>
            <details className="rounded-2xl border border-[var(--color-line)] bg-white p-3.5"><summary className="cursor-pointer font-black">How is this verified cross-chain?</summary><p className="mt-1.5 text-[var(--color-muted)]">Sepolia top-ups are proven on Creditcoin through the Attestcoin Protocol. The full check lives under the Score tab.</p></details>
          </div>
        </section>

        {/* JUDGES · collapsed by default on phones */}
        <section id="why" aria-labelledby="why-2-h" className="bg-[#0d0c0a] px-4 py-8 text-[#f6f1e7]">
          <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <EyeIcon className="h-6 w-6" aria-hidden />
            <h2 id="why-2-h" className="text-xl font-black tracking-tight">Why it works</h2>
          </div>
          <div className="mt-3 grid gap-3 text-[14px] leading-relaxed md:grid-cols-3">
            <p className="rounded-2xl border border-white/20 p-4"><strong>Credit from nothing, in any market.</strong> Mile 12, Onitsha, Kibera, Makola · one ledger · one tomato sale and a neighbour's tap.</p>
            <p className="rounded-2xl border border-white/20 p-4"><strong>Proof, not promises.</strong> Sepolia payments verified on Creditcoin through Attestcoin · every boost is checkable on-chain.</p>
            <p className="rounded-2xl border border-white/20 p-4"><strong>One thumb, 90 seconds.</strong> Built for basic phones and big screens alike · zero jargon end to end.</p>
          </div>
          <div className="tabular mt-3 flex flex-wrap gap-2 text-[11.5px] font-bold">
            {[['Registry', CONTRACTS.registry], ['Verifier', CONTRACTS.verifier], ['Pool', CONTRACTS.pool]].map(([label, addr]) => (
              addr ? (
                <a key={label} href={`https://creditcoin-testnet.blockscout.com/address/${addr}`} target="_blank" rel="noreferrer"
                  className="rounded-full border border-white/25 px-3 py-1.5 text-white/80">
                  {label} · {shortHash(addr)}
                </a>
              ) : null
            ))}
          </div>
          </div>
        </section>
        </>
        )}
      </main>

      <BankStatement trader={trader} slips={slips} score={t.score} />

      <footer className="screen-only border-t-2 border-black bg-[#0c0b09] text-[#faf5ea]">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:py-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-2xl font-black tracking-tight">Bring your market on-chain.</p>
            <p className="mt-1 text-[14px] text-white/65">Free to try · BUIDL CTC 2026 Fall · DeFi + RWA · Built for CEIP.</p>
          </div>
          <div className="flex flex-row items-center justify-center gap-2 md:justify-end">
            <button type="button" onClick={() => go('new')} className="grid min-h-[46px] flex-1 place-items-center rounded-2xl bg-[#ff5a2b] px-3 text-[13.5px] font-black text-white sm:flex-none sm:px-5 sm:text-[15px]">Start a receipt</button>
            <button type="button" onClick={() => go('score')} className="grid min-h-[46px] flex-1 place-items-center rounded-2xl border border-white/30 px-3 text-[13.5px] font-black text-white sm:flex-none sm:px-5 sm:text-[15px]">Your standing</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 px-4 py-4 text-[12px] font-semibold text-white/50">
          <span className="inline-flex items-center gap-1"><WalletIcon className="h-4 w-4" aria-hidden /> Creditcoin testnet · Sepolia verified</span>
          <nav className="flex items-center gap-4" aria-label="Documents">
            <button type="button" onClick={() => go('paper')} className="underline underline-offset-4">Whitepaper</button>
            <button type="button" onClick={() => go('terms')} className="underline underline-offset-4">Terms</button>
            <button type="button" onClick={() => go('privacy')} className="underline underline-offset-4">Privacy</button>
          </nav>
          <span className="ml-auto inline-flex items-center gap-1"><PhotoIcon className="h-4 w-4" aria-hidden /> Unsplash · DiceBear · Heroicons</span>
        </div>
      </footer>

      {/* Bottom tab bar · the app feel */}
      <nav aria-label="App sections"
        className="screen-only fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--color-ink)] bg-[var(--color-paper)]/97 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-5">
          {(
            [
              ['home', 'Home', HomeIcon],
              ['market', 'Market', ClipboardDocumentListIcon],
              ['new', 'New', PlusCircleIcon],
              ['receipts', 'Bills', TicketIcon],
              ['score', 'Score', UserGroupIcon],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={screen === id ? 'page' : undefined}
              className={`grid min-h-[62px] place-items-center gap-0.5 text-[10.5px] font-black uppercase tracking-widest ${screen === id ? 'bg-[var(--color-ink)] text-[var(--color-paper)]' : ''} ${id === 'new' && screen !== 'new' ? 'bg-[#ff3c1a] text-white' : ''}`}
            >
              <Icon className="h-5 w-5" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
