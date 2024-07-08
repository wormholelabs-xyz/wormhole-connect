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

import { clusterApiUrl, ConfirmOptions, Connection } from '@solana/web3.js';

import { SignRequestSolana } from 'utils/wallet/types';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';

import config from 'config';

import { createPriorityFeeInstructions } from '@wormhole-foundation/sdk-solana';

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
  request: SignRequestSolana,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  if (config.rpcs.solana) {
    const conn = new Connection(config.rpcs.solana);
    const bh = await conn.getLatestBlockhash();
    request.transaction.recentBlockhash = bh.blockhash;
    request.transaction.lastValidBlockHeight = bh.lastValidBlockHeight;

    let computeBudgetIx = await createPriorityFeeInstructions(
      conn,
      request.transaction,
      0.75,
    );
    request.transaction.add(...computeBudgetIx);

    if (request.signers) {
      request.transaction.partialSign(...request.signers);
    }
  } else {
    throw new Error('Need Solana RPC');
  }

  return await (wallet as SolanaWallet).signAndSendTransaction({
    transaction: request.transaction,
    options,
  });
}
