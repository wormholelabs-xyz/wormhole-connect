import {
  Network,
  Chain,
  Platform,
  UnsignedTransaction,
} from '@wormhole-foundation/sdk';

export enum WalletSide {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

export interface WalletProviderRequest {
  network: Network;
  chain: Chain;
  platform: Platform;

  side: WalletSide;
}

export interface WalletProvider {
  isConnected(): Promise<boolean>;

  getAddress(): Promise<string | undefined>;

  signTransaction(): Promise<any>;

  promptConnect(): void;

  promptDisconnect(): void;
}

export type WalletProviderHandler = (
  info: WalletProviderRequest,
) => Promise<WalletProvider>;
