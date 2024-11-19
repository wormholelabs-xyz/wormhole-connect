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

export interface WalletProviderRequest<N extends Network, C extends Chain> {
  network: N;
  chain: C;
  platform: Platform;

  side: WalletSide;
}

export interface WalletProvider<N extends Network, C extends Chain> {
  isConnected(): Promise<boolean>;

  getAddress(): Promise<string | undefined>;

  signTransaction(): Promise<UnsignedTransaction<N, C>>;

  promptConnect(): void;

  promptDisconnect(): void;
}

export type WalletProviderHandler<N extends Network, C extends Chain> = (
  info: WalletProviderRequest<N, C>,
) => Promise<WalletProvider<N, C>>;
