import { defineChain } from 'viem'

export const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: { name: 'tCTC', symbol: 'tCTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://creditcoin-testnet.blockscout.com',
    },
  },
  testnet: true,
})

export const sepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
})

export const ATTEST = {
  dashboard: 'https://dashboard.cc3-testnet.creditcoin.network/',
  proofBuilder: 'https://proof-gen-api.cc3-testnet.creditcoin.network/',
  blockProver: '0x0000000000000000000000000000000000000FD2' as const,
  chainInfo: '0x0000000000000000000000000000000000000fd3' as const,
  decoder: '0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f' as const,
  sepoliaChainKey: 1,
  mainnetChainKey: 3,
} as const
