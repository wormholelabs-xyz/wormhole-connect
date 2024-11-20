import {
  Network,
  Chain,
  UnsignedTransaction,
  ChainToPlatform,
} from '@wormhole-foundation/sdk';

export enum WalletSide {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

export interface WalletProviderRequest<N extends Network, C extends Chain> {
  network: N;
  chain: C;
  platform: ChainToPlatform<C>;

  side: WalletSide;
}

export interface WalletProvider<N extends Network, C extends Chain> {
  isConnected(): Promise<boolean>;

  getAddress(): Promise<string | undefined>;

  signTransaction(tx: UnsignedTransaction<N, C>): Promise<string>;

  promptConnect(): void;

  promptDisconnect(): void;
}

export type WalletProviderHandler<N extends Network, C extends Chain> = (
  info: WalletProviderRequest<N, C>,
) => Promise<WalletProvider<N, C>>;
