// Deployed addresses — fill after `npm run deploy:testnet` (see contracts/README).
// Demo mode works without deployment; Real mode needs these + a funded wallet.
import { parseAbi } from 'viem'

export const CONTRACTS = {
  registry: (import.meta.env.VITE_REGISTRY as string) || '',
  pool: (import.meta.env.VITE_POOL as string) || '',
  verifier: (import.meta.env.VITE_VERIFIER as string) || '',
} as const

export const REGISTRY_ABI = parseAbi([
  'function openRisiti(address buyer, uint256 amount, string memo, string photo) returns (uint256)',
  'function confirmRisiti(uint256 id)',
  'function witnessRisiti(uint256 id)',
  'function confirmVerbal(uint256 id)',
  'function trustScore(address who) view returns (uint256 score, uint256 count, uint256 volume)',
  'function advanceLimit(address who) view returns (uint256)',
  'function linkRestockProof(address sellerProfile, uint64 chainKey, uint64 headerNumber, bytes txBytes, (bytes32 root, (bytes32 hash, bool isLeft)[] siblings) merkleProof, (bytes32 lowerEndpointDigest, bytes32[] roots) continuityProof, bytes32 proofHash)',
  'function addVoice(string trade, string quote)',
  'function risitis(uint256) view returns (uint256 id, address seller, address buyer, uint256 amount, string memo, string photo, uint64 createdAt, uint64 confirmedAt, bool confirmed, bool witnessed, address witness, bool restockBoosted)',
  'function nextId() view returns (uint256)',
  'event Voice(address indexed trader, string trade, string quote)',
  'event RisitiOpened(uint256 indexed id, address indexed seller, address indexed buyer, uint256 amount, string memo)',
  'event RisitiConfirmed(uint256 indexed id, address indexed buyer, uint64 at)',
])

export const POOL_ABI = parseAbi([
  'function fund() payable',
  'function draw(uint256 amount)',
  'function repay() payable',
  'function pot() view returns (uint256)',
])
