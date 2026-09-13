# Attestcoin Protocol integration — Risiti (CC3 testnet)

Every submission must integrate Attestcoin **as a core feature**. Risiti uses it for
**supplier-restock verification**: a trader's inventory purchase paid on Sepolia proves
real-world restock activity on Creditcoin and boosts the trust score.

## Endpoints (CC3 testnet)

- ASC dashboard: https://dashboard.cc3-testnet.creditcoin.network/
- Proof builder API: https://proof-gen-api.cc3-testnet.creditcoin.network/
- BlockProver precompile: `0x0000000000000000000000000000000000000FD2`
- ChainInfo precompile: `0x0000000000000000000000000000000000000fd3`
- Decoder contract: `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f`
- Source chains: Sepolia `chainKey=1`, Ethereum mainnet `chainKey=3`
- SDK: `@gluwa/usc-sdk` (+ `ethers` v6 peer)

## Flow (implemented in `src/lib/attest.ts`)

1. **Resolve** the Sepolia restock tx → block number (`JsonRpcProvider.getTransaction`).
2. **Wait** for Creditcoin attestation: `ProofBuilder.waitUntilHeightAttested(chainKey, block)`.
   Attestation lags ~9 minutes by design; the UI shows this honestly.
3. **Prove**: `ProofBuilder.getProof(txHash)` → `{ chainKey, headerNumber, txBytes, merkleProof, continuityProof }`.
4. **Verify on-chain**: `PrecompileBlockProver.verifySingle(...)` calls precompile `0xFD2`
   over the Creditcoin RPC. Only `true` counts — the UI then submits
   `RisitiRegistry.linkRestockProof` with the identical proof structs, so the
   precompile re-checks inside the state-changing call. No guesswork: the
   struct layout is copied from the installed SDK's `block_prover` ABI.
5. **Decode (judge-verifiable)**: the receipt's ERC-20 `Transfer` log emitter must be an accepted
   token and the recipient the plan's collection address — same binding rule as remit-to-own,
   so a stranger's transfer cannot credit your stall.

Batch path (`getBatchProof`, ≤10 txs, ≤1000-block span) is supported for market-day restocks
sharing one continuity proof.

## Contracts

- `contracts/RisitiRegistry.sol` — receipts (open/confirm/witness/verbal), score,
  `linkRestockProof` which calls the precompile's real
  `verify(uint64,uint64,bytes,tuple,tuple)` in live mode (`demoMode=false`),
  replay guard (`proofUsed`), and the `Voice` guestbook.
- `contracts/AttestcoinVerifier.sol` — standalone `verifyAndTag` with the exact
  struct layout from the official `@gluwa/usc-sdk` block-prover ABI.
- `contracts/RisitiPool.sol` — chama advances gated by `registry.advanceLimit`.

## Depth (scoring criterion)

- Not a badge: restock proofs change credit outcomes (+2 slip-equivalents, witness-grade weight).
- Not centralized: no relayer/oracle/backend authority — anyone may submit the same proof.
- Auditable: every step links to ASC dashboard + Blockscout + the exact proof bytes.
- Honest modes: Demo (instant, localStorage) vs Real (wallet + 0xFD2). The contract's
  `demoMode` flag is explicit and toggleable on-chain; production deploys set `false`.

## Reproduce (15 min + attestation wait)

1. Send any small Sepolia USDC/ETH transfer (public faucet funds suffice), copy tx hash.
2. Open Risiti → Restock proof → paste hash → Prove + link.
3. Observe: resolve → attestation wait → proof → 0xFD2 verify → ledger `restock proven` + score +2.
4. Cross-check the tx on the ASC dashboard and Creditcoin Blockscout.
