import { Icon, TokenConfig, TokenAddressesByChain } from '../types';

export const DEVNET_TOKENS: TokenConfig[] = [
  {
    key: 'ETH',
    symbol: 'ETH',
    nativeChain: 'Ethereum',
    icon: Icon.ETH,
    wrappedAsset: 'WETH',
    tokenId: {
      chain: 'Ethereum',
      address: 'native',
    },
  },
  {
    key: 'WETH',
    symbol: 'WETH',
    nativeChain: 'Ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'Ethereum',
      address: '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E',
    },
  },
  {
    key: 'TKN',
    symbol: 'TKN',
    nativeChain: 'Ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'Ethereum',
      address: '0x2D8BE6BF0baA74e0A907016679CaE9190e80dD0A',
    },
  },
];

export const DEVNET_WRAPPED_TOKENS: TokenAddressesByChain = {};
