import { CONFIG } from 'sdklegacy';
import { ChainsConfig, Icon } from '../types';

const { chains } = CONFIG.DEVNET;

export const DEVNET_CHAINS: ChainsConfig = {
  Ethereum: {
    ...chains.Ethereum!,
    sdkName: 'Ethereum',
    displayName: 'EVM',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'ETH',
    chainId: 1,
    icon: Icon.ETH,
    maxBlockSearch: 0,
  },
  Wormchain: {
    ...chains.Wormchain!,
    sdkName: 'Wormchain',
    displayName: 'Wormchain',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'WORM',
    chainId: 'wormchain-1',
    icon: Icon.OSMO,
    maxBlockSearch: 0,
  },
  Terra2: {
    ...chains.Terra2!,
    sdkName: 'Terra2',
    displayName: 'Terra',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'LUNA',
    chainId: 'localterra',
    icon: Icon.OSMO,
    maxBlockSearch: 0,
  },
};
