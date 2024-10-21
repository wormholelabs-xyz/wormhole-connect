import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { useEffect, useState } from 'react';
import { accessBalance, Balances, updateBalances } from 'store/transferInput';
import config, { getWormholeContextV2 } from 'config';
import { Token } from 'config/tokens';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import /*getTokenBridgeWrappedTokenAddress*/ 'utils/sdkv2';
import { Chain, TokenAddress, amount } from '@wormhole-foundation/sdk';
import { getTokenDecimals } from 'utils';

const useGetTokenBalances = (
  walletAddress: string,
  chain: Chain | undefined,
  tokens: Token[],
): { isFetching: boolean; balances: Balances } => {
  const [isFetching, setIsFetching] = useState(false);
  const [balances, setBalances] = useState<Balances>({});
  const cachedBalances = useSelector(
    (state: RootState) => state.transferInput.balances,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    setIsFetching(true);
    setBalances({});
    if (
      !walletAddress ||
      !chain ||
      !config.chains[chain] ||
      tokens.length === 0
    ) {
      setIsFetching(false);
      return;
    }
    const chainConfig = config.chains[chain];
    if (!chainConfig) {
      setIsFetching(false);
      return;
    }

    let isActive = true;

    const getBalances = async () => {
      const updatedBalances: Balances = {};
      const needsUpdate: Token[] = [];
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      let updateCache = false;

      for (const token of tokens) {
        const cachedBalance = accessBalance(
          cachedBalances,
          walletAddress,
          chain,
          token,
        );

        if (cachedBalance && cachedBalance.lastUpdated > fiveMinutesAgo) {
          updatedBalances[token.key] = cachedBalance;
        } else {
          needsUpdate.push(token);
        }
      }

      if (needsUpdate.length > 0) {
        try {
          const wh = await getWormholeContextV2();
          const platform = wh.getPlatform(chainToPlatform(chain));
          const rpc = platform.getRpc(chain);
          const tokenAddresses: TokenAddress<Chain>[] = [];
          for (const token of needsUpdate) {
            const decimals = getTokenDecimals(chain, token);

            updatedBalances[token.key] = {
              balance: amount.fromBaseUnits(0n, decimals),
              lastUpdated: now,
            };

            tokenAddresses.push(token.address);
          }

          if (tokenAddresses.length === 0) {
            return;
          }

          const result = await platform
            .utils()
            .getBalances(
              chain,
              rpc,
              walletAddress,
              tokenAddresses as TokenAddress<typeof chain>[],
            );

          for (const tokenAddress in result) {
            const token = config.tokens.get(chain, tokenAddress);

            if (token) {
              const decimals = getTokenDecimals(chain, token);
              const bus = result[tokenAddress];
              const balance = amount.fromBaseUnits(bus ?? 0n, decimals);

              updatedBalances[token.key] = {
                balance,
                lastUpdated: now,
              };
            }
          }

          updateCache = true;
        } catch (e) {
          console.error('Failed to get token balances', e);
        }
      }
      if (isActive) {
        setIsFetching(false);

        setBalances(updatedBalances);
        if (updateCache) {
          dispatch(
            updateBalances({
              address: walletAddress,
              chain,
              balances: updatedBalances,
            }),
          );
        }
      }
    };

    getBalances();

    return () => {
      isActive = false;
    };
  }, [cachedBalances, chain, dispatch, tokens, walletAddress]);

  return { isFetching, balances };
};

export default useGetTokenBalances;
