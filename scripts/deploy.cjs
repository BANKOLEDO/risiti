/**
 * One-command testnet deploy: Registry -> Verifier -> Pool(registry).
 * Writes addresses straight into .env (VITE_REGISTRY / VITE_VERIFIER / VITE_POOL).
 *
 * SAFETY: use a FRESH burner wallet with ONLY free testnet tokens.
 * Never use a key that holds real money.
 *
 *   1. Fresh MetaMask account (or `npx viem generate`), fund via Discord faucet.
 *   2. $env:DEPLOYER_KEY="0xabc..."   (PowerShell)  — never commit this.
 *   3. node scripts/deploy.cjs
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const RPC = 'https://rpc.cc3-testnet.creditcoin.network';
const CHAIN = {
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: { name: 'tCTC', symbol: 'tCTC', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
};

const SOURCES = {
  RisitiRegistry: 'contracts/RisitiRegistry.sol',
  AttestcoinVerifier: 'contracts/AttestcoinVerifier.sol',
  RisitiPool: 'contracts/RisitiPool.sol',
};

function compileAll() {
  const input = {
    language: 'Solidity',
    sources: {},
    settings: { viaIR: true, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
  };
  for (const [name, file] of Object.entries(SOURCES)) {
    input.sources[file] = { content: fs.readFileSync(file, 'utf8') };
  }
  // Pool imports Registry — help solc resolve relative imports from contracts/.
  const output = JSON.parse(
    solc.compile(
      JSON.stringify(input),
      { import: (p) => {
        const full = path.join('contracts', path.basename(p));
        try {
          return { contents: fs.readFileSync(full, 'utf8') };
        } catch {
          return { error: 'not found: ' + p };
        }
      } },
    ),
  );
  const errors = (output.errors || []).filter((e) => e.severity === 'error');
  if (errors.length) {
    for (const e of errors) console.error(e.formattedMessage || e.message);
    throw new Error('compile failed');
  }
  const artifacts = {};
  for (const [name, file] of Object.entries(SOURCES)) {
    const c = output.contracts[file][name];
    artifacts[name] = { abi: c.abi, bytecode: '0x' + c.evm.bytecode.object };
  }
  return artifacts;
}

async function main() {
  const key = process.env.DEPLOYER_KEY;
  if (!key) throw new Error('Set DEPLOYER_KEY first (burner wallet, testnet only).');
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ account, chain: CHAIN, transport: http(RPC) });
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC) });

  const bal = await publicClient.getBalance({ address: account.address });
  console.log('Deployer:', account.address, '| balance:', bal.toString(), 'wei');
  if (bal === 0n) throw new Error('No tCTC. Fund via Discord #token-faucet first.');

  console.log('Compiling…');
  const art = compileAll();

  async function deploy(name, args = []) {
    console.log('Deploying', name, '…');
    const hash = await wallet.deployContract({ abi: art[name].abi, bytecode: art[name].bytecode, args });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(name, '->', receipt.contractAddress, '(tx', hash + ')');
    return receipt.contractAddress;
  }

  const registry = await deploy('RisitiRegistry');
  const verifier = await deploy('AttestcoinVerifier');
  const pool = await deploy('RisitiPool', [registry]);

  const envPath = '.env';
  let env = '';
  try {
    env = fs.readFileSync(envPath, 'utf8');
  } catch {
    env = fs.readFileSync('.env.example', 'utf8');
  }
  const set = (k, v) =>
    env.match(new RegExp('^' + k + '=.*$', 'm'))
      ? env.replace(new RegExp('^' + k + '=.*$', 'm'), k + '=' + v)
      : env + '\n' + k + '=' + v + '\n';
  env = set('VITE_REGISTRY', registry);
  env = set('VITE_VERIFIER', verifier);
  env = set('VITE_POOL', pool);
  fs.writeFileSync(envPath, env);
  console.log('\nDone. .env updated. Restart dev: Ctrl+C, npm run dev');
}

main().catch((e) => {
  console.error('FAILED:', e.message || e);
  process.exit(1);
});
