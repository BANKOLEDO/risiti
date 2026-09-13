import { createPublicClient, formatEther, http, parseAbiItem } from 'viem'
import { creditcoinTestnet } from './chain'
import { REGISTRY_ABI } from './contracts'

const RPC = 'https://rpc.cc3-testnet.creditcoin.network'

function client() {
  return createPublicClient({ chain: creditcoinTestnet, transport: http(RPC) })
}

export type ChainSlip = {
  id: string
  seller: string
  buyer: string
  amount: string
  memo: string
  confirmed: boolean
  witnessed: boolean
}

export type ChainVoice = {
  trader: string
  trade: string
  quote: string
}

/** Every receipt ever opened on this registry — readable by any phone. */
export async function getChainSlips(registry: `0x${string}`): Promise<ChainSlip[]> {
  const c = client()
  const next = (await c.readContract({ address: registry, abi: REGISTRY_ABI, functionName: 'nextId' })) as bigint
  const out: ChainSlip[] = []
  const cap = Math.min(Number(next), 51)
  for (let i = 1; i < cap; i++) {
    const r = (await c.readContract({ address: registry, abi: REGISTRY_ABI, functionName: 'risitis', args: [BigInt(i)] })) as unknown as {
      id: bigint; seller: string; buyer: string; amount: bigint; memo: string;
      confirmed: boolean; witnessed: boolean;
    }
    if (r.id !== 0n) {
      out.push({
        id: `CC3-${r.id.toString()}`,
        seller: r.seller,
        buyer: r.buyer,
        amount: `${Number(formatEther(r.amount)).toFixed(2)} tCTC`,
        memo: r.memo,
        confirmed: r.confirmed,
        witnessed: r.witnessed,
      })
    }
  }
  return out.reverse()
}

/** Every voice ever shouted — event logs, global by nature. */
export async function getChainVoices(registry: `0x${string}`): Promise<ChainVoice[]> {
  const c = client()
  const logs = await c.getLogs({
    address: registry,
    event: parseAbiItem('event Voice(address indexed trader, string trade, string quote)'),
    fromBlock: 0n,
  })
  return logs.map((l) => ({
    trader: (l.args as unknown as { trader: string }).trader,
    trade: (l.args as unknown as { trade: string }).trade,
    quote: (l.args as unknown as { quote: string }).quote,
  })).reverse()
}

export async function getChainScore(
  registry: `0x${string}`,
  who: `0x${string}`,
): Promise<{ score: number; count: number } | null> {
  try {
    const c = client()
    const r = (await c.readContract({ address: registry, abi: REGISTRY_ABI, functionName: 'trustScore', args: [who] })) as unknown as {
      score: bigint; count: bigint;
    }
    return { score: Number(r.score), count: Number(r.count) }
  } catch {
    return null
  }
}
