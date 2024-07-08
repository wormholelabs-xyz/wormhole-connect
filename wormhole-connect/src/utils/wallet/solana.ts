import { WalletAdapterNetwork as SolanaNetwork } from '@solana/wallet-adapter-base';

import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  BitgetWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter,
  NightlyWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import {
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  Transaction,
} from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';

import config from 'config';

import {
  createPriorityFeeInstructions,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';
import { Network } from '@wormhole-foundation/sdk';

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replaceAll('wallet', '').trim();

export function fetchOptions() {
  const tag = config.isMainnet ? 'mainnet-beta' : 'devnet';
  const connection = new Connection(config.rpcs.solana || clusterApiUrl(tag));

  return {
    ...getSolanaStandardWallets(connection).reduce(
      (acc, w) => {
        acc[getWalletName(w)] = w;
        return acc;
      },
      {} as Record<string, Wallet>,
    ),
    bitget: new SolanaWallet(new BitgetWalletAdapter(), connection),
    clover: new SolanaWallet(new CloverWalletAdapter(), connection),
    coin98: new SolanaWallet(new Coin98WalletAdapter(), connection),
    solong: new SolanaWallet(new SolongWalletAdapter(), connection),
    torus: new SolanaWallet(new TorusWalletAdapter(), connection),
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    ...(config.walletConnectProjectId
      ? {
          walletConnect: new SolanaWallet(
            new WalletConnectWalletAdapter({
              network: config.isMainnet
                ? SolanaNetwork.Mainnet
                : SolanaNetwork.Devnet,
              options: {
                projectId: config.walletConnectProjectId,
              },
            }),
            connection,
          ),
        }
      : {}),
  };
}

export async function signAndSendTransaction(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const tx = request.transaction.transaction as Transaction;

  if (config.rpcs.solana) {
    const conn = new Connection(config.rpcs.solana);
    const bh = await conn.getLatestBlockhash();
    tx.recentBlockhash = bh.blockhash;
    tx.lastValidBlockHeight = bh.lastValidBlockHeight;

    let computeBudgetIx = await createPriorityFeeInstructions(conn, tx, 0.75);
    tx.add(...computeBudgetIx);

    if (request.transaction.signers) {
      tx.partialSign(...request.transaction.signers);
    }
  } else {
    throw new Error('Need Solana RPC');
  }

  return await (wallet as SolanaWallet).signAndSendTransaction({
    transaction: tx,
    options,
  });
}
