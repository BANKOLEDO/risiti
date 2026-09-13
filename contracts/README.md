# Deploy to Creditcoin testnet (102031) — free, ~5 minutes

## 1. Fund
- EVM address → Creditcoin Discord `#token-faucet`: `/faucet address:0xYOUR_EVM`
- Confirm tCTC on https://creditcoin-testnet.blockscout.com/
- Sepolia ETH: any public Sepolia faucet (only needed for the restock proof).

## 2. Deploy (Foundry)
```bash
forge create contracts/RisitiRegistry.sol:RisitiRegistry \
  --rpc-url https://rpc.cc3-testnet.creditcoin.network \
  --private-key $PRIVATE_KEY
# → note REGISTRY address, then:
forge create contracts/AttestcoinVerifier.sol:AttestcoinVerifier \
  --rpc-url https://rpc.cc3-testnet.creditcoin.network \
  --private-key $PRIVATE_KEY
forge create contracts/RisitiPool.sol:RisitiPool \
  --rpc-url https://rpc.cc3-testnet.creditcoin.network \
  --private-key $PRIVATE_KEY --constructor-args $REGISTRY
```
Verify each on Blockscout (Flatten + MIT + 0.8.26), then:
```bash
cast call $REGISTRY "demoMode()" --rpc-url https://rpc.cc3-testnet.creditcoin.network
# keep true for judging convenience; set false via setDemoMode(false) for the strict live cut
```

## 3. Wire frontend
```bash
cp .env.example .env
# fill VITE_REGISTRY / VITE_POOL / VITE_VERIFIER, then:
npm run dev   # Real mode → connect wallet (chain 102031 auto)
```

## No-forge fallback (Remix, 2 minutes)
Paste each contract into https://remix.ethereum.org, compile 0.8.26, Injected Provider →
Custom network 102031 → Deploy in order Registry → Verifier → Pool(registry).
