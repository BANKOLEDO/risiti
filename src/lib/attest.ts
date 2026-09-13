import { JsonRpcProvider } from 'ethers'
import { blockProver, chainInfo, proofProvider } from '@gluwa/usc-sdk'
import { ATTEST } from './chain'

export type AttestState =
  | { status: 'idle' }
  | { status: 'checking' | 'waiting' | 'proving' | 'verifying'; step: string }
  | { status: 'verified'; txHash: string; blockNumber: number; proofHash: string; explorer: string }
  | { status: 'failed'; step: string; error: string }

/**
 * Real Attestcoin flow (CC3 testnet, Sepolia chainKey=1):
 * 1. resolve tx block on Sepolia
 * 2. wait until attested via ProofBuilder cache
 * 3. getProof (merkle + continuity)
 * 4. verifySingle against BlockProver precompile 0xFD2 via Creditcoin RPC
 * Returns proof bytes so the app can call RisitiRegistry.linkRestockProof.
 */
export async function proveSepoliaRestock(
  sepoliaTxHash: string,
  onStep: (s: AttestState) => void,
): Promise<{
  chainKey: number
  headerNumber: number
  txBytes: string
  merkleProof: unknown
  continuityProof: unknown
  blockNumber: number
} | null> {
  try {
    onStep({ status: 'checking', step: 'Resolving Sepolia transaction…' })
    const sepoliaRpc =
      (import.meta.env.VITE_SEPOLIA_RPC as string) ||
      'https://ethereum-sepolia-rpc.publicnode.com'
    const sourceProvider = new JsonRpcProvider(sepoliaRpc)
    const creditcoinProvider = new JsonRpcProvider(
      'https://rpc.cc3-testnet.creditcoin.network',
    )

    const chainKey = ATTEST.sepoliaChainKey
    const tx = await sourceProvider.getTransaction(sepoliaTxHash)
    if (!tx || tx.blockNumber == null) {
      onStep({ status: 'failed', step: 'resolve', error: 'Transaction not found on Sepolia yet. Wait for 1 confirmation.' })
      return null
    }

    onStep({ status: 'waiting', step: `Tx in block ${tx.blockNumber}. Waiting for Creditcoin attestation (~9 min)…` })
    const builder = new proofProvider.service.ProofBuilder(
      chainKey,
      ATTEST.proofBuilder,
      8000,
    )
    await builder.waitUntilHeightAttested(chainKey, tx.blockNumber)

    onStep({ status: 'proving', step: 'Attested. Generating Merkle + continuity proof…' })
    const result = await builder.getProof(sepoliaTxHash)
    if (!result.success || !result.data) {
      onStep({ status: 'failed', step: 'prove', error: String(result.error ?? 'Proof builder failed') })
      return null
    }
    const { chainKey: ck, headerNumber, txBytes, merkleProof, continuityProof } = result.data

    onStep({ status: 'verifying', step: 'Verifying via BlockProver precompile 0xFD2…' })
    const prover = new blockProver.PrecompileBlockProver(creditcoinProvider)
    const verified = await prover.verifySingle(ck, headerNumber, txBytes, merkleProof, continuityProof)
    if (!verified) {
      onStep({ status: 'failed', step: 'verify', error: 'Precompile returned false. Proof did not verify.' })
      return null
    }
    void chainInfo // keep import referenced for docs parity (supported-chain lookup in README script)
    return { chainKey: ck, headerNumber, txBytes, merkleProof, continuityProof, blockNumber: tx.blockNumber }
  } catch (e) {
    onStep({ status: 'failed', step: 'error', error: e instanceof Error ? e.message : String(e) })
    return null
  }
}

export function shortHash(h: string, n = 6) {
  if (!h) return '—'
  return `${h.slice(0, 2 + n)}…${h.slice(-4)}`
}

export type RestockProof = Exclude<Awaited<ReturnType<typeof proveSepoliaRestock>>, null>
