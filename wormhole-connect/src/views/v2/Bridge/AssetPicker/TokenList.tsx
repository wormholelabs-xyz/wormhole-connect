import React, { useMemo } from 'react';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';
import { amount as sdkAmount, toNative } from '@wormhole-foundation/sdk';

import useGetTokenBalances from 'hooks/useGetTokenBalances';
import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v2/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v2/Bridge/AssetPicker/TokenItem';
import {
  getDisplayName,
  isCanonicalToken,
  isFrankensteinToken,
  isWrappedToken,
} from 'utils';
import { getTokenBridgeWrappedTokenAddressSync } from 'utils/sdkv2';
import config from 'config';

const useStyles = makeStyles()((theme) => ({
  card: {
    maxWidth: '420px',
  },
  cardContent: {
    paddingTop: 0,
  },
  title: {
    fontSize: 14,
    marginBottom: '8px',
  },
  tokenLoader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  tokenList: {
    maxHeight: 340,
  },
}));

type Props = {
  tokenList?: Array<Token>;
  isFetching?: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  selectedTokenChain?: string;
  sourceToken?: Token;
  wallet: WalletData;
  onSelectToken: (key: Token) => void;
  isSource: boolean;
};

const TokenList = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const { isFetching: isFetchingTokenBalances, balances } = useGetTokenBalances(
    props.wallet?.address || '',
    props.selectedChainConfig.key,
    props.tokenList || [],
  );

  const sortedTokens = useMemo(() => {
    const nativeToken = props.tokenList?.find(
      (t) => t.key === props.selectedChainConfig.gasToken,
    );

    const tokenSet: Set<string> = new Set();
    const tokens: Array<Token> = [];

    // First: Add previously selected token at the top of the list,
    // only if it's the selected token's chain
    if (
      props.selectedToken &&
      props.selectedTokenChain === props.selectedChainConfig.key &&
      !tokenSet.has(props.selectedToken.key)
    ) {
      tokenSet.add(props.selectedToken.key);
      tokens.push(props.selectedToken);
    }

    /*
     *
     * TODO token refactor...

    // Second: Add the wrapped token of the source token, if sourceToken is defined (meaning
    // this is being rendered with destination tokens) and the wrapped is not a Frankenstein token
    if (props.sourceToken) {
        const destTokenKey = props.sourceToken.wrappedAsset;
        if (destTokenKey) {
          const destTokenConfig = props.tokenList?.find(
            (t) =>
              t.key === destTokenKey &&
              // Only add the wrapped token if it actually exists on the destination chain
              !!getTokenBridgeWrappedTokenAddressSync(
                t,
                props.selectedChainConfig.key,
              ),
          );

          if (
            destTokenConfig &&
            !tokenSet.has(destTokenConfig.key) &&
            !isFrankensteinToken(destTokenConfig, props.selectedChainConfig.key)
          ) {
            tokenSet.add(destTokenConfig.key);
            tokens.push(destTokenConfig);
          }
      }
    }
    */

    // Third: Add the native gas token
    if (
      nativeToken &&
      nativeToken.key !== props.selectedToken?.key &&
      !tokenSet.has(nativeToken.key)
    ) {
      tokenSet.add(nativeToken.key);
      tokens.push(nativeToken);
    }

    // Fourth: Add tokens with a balances in the connected wallet
    Object.entries(balances).forEach(([key, val]) => {
      if (val?.balance && sdkAmount.units(val.balance) > 0n) {
        const tokenConfig = props.tokenList?.find((t) => t.key === key);

        if (tokenConfig && !tokenSet.has(tokenConfig.key)) {
          tokenSet.add(tokenConfig.key);
          tokens.push(tokenConfig);
        }
      }
    });

    // Finally: If this is destination token or no wallet is connected,
    // fill up any remaining space from supported and non-Frankenstein tokens
    if (!props.isSource || !props.wallet?.address) {
      props.tokenList?.forEach((t) => {
        // Check if previously added
        if (tokenSet.has(t.key)) {
          return;
        }

        // Exclude frankenstein tokens
        if (isFrankensteinToken(t, props.selectedChainConfig.key)) {
          return;
        }

        // Exclude wormhole-wrapped tokens, unless it's canonical
        if (
          props.isSource &&
          isWrappedToken(t, props.selectedChainConfig.key) &&
          !isCanonicalToken(t, props.selectedChainConfig.key)
        ) {
          return;
        }

        tokenSet.add(t.key);
        tokens.push(t);
      });
    }

    return tokens;
  }, [
    balances,
    props.tokenList,
    props.selectedChainConfig.key,
    props.selectedChainConfig.gasToken,
    props.sourceToken,
    props.isSource,
    props.wallet?.address,
    props.selectedToken,
    props.selectedTokenChain,
  ]);

  const noTokensMessage = useMemo(
    () => (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        No supported tokens found in wallet
      </Typography>
    ),
    [theme.palette.grey.A400],
  );

  const shouldShowEmptyMessage =
    sortedTokens.length === 0 && !isFetchingTokenBalances && !props.isFetching;

  console.log(sortedTokens);

  const searchList = (
    <SearchableList<Token>
      searchPlaceholder="Search for a token"
      className={classes.tokenList}
      listTitle={
        shouldShowEmptyMessage ? (
          noTokensMessage
        ) : (
          <Typography fontSize={14} color={theme.palette.text.secondary}>
            Tokens on {props.selectedChainConfig.displayName}
          </Typography>
        )
      }
      loading={
        props.isFetching && (
          <ListItemButton className={classes.tokenLoader} dense>
            <CircularProgress />
          </ListItemButton>
        )
      }
      items={sortedTokens}
      onQueryChange={(query) => {
        try {
          const chain = props.selectedChainConfig.sdkName;
          const address = toNative(chain, query);

          if (address) {
            // Parsed valid token :)
            const existing = config.tokens.get(chain, query);
            if (!existing) {
              console.log('unknown token', chain, address);
              config.tokens.getOrFetch({ chain, address });
            }
          }
        } catch (e) {}
        console.log(query);
      }}
      filterFn={(token, query) => {
        if (query.length === 0) return true;

        const chain = props.selectedChainConfig.key;

        // Exclude frankenstein tokens with no balance
        const balance = Number(balances?.[token.key]?.balance);
        if (isFrankensteinToken(token, chain) && !balance) {
          return false;
        }

        // Exclude wormhole-wrapped tokens with no balance
        // unless it's canonical
        if (
          props.isSource &&
          isWrappedToken(token, chain) &&
          !isCanonicalToken(token, chain) &&
          !balance
        ) {
          return false;
        }

        const queryLC = query.toLowerCase();

        const symbolMatch = [token.symbol].some((criteria) =>
          criteria?.toLowerCase()?.includes?.(queryLC),
        );
        if (symbolMatch) return true;

        const displayNameMatch = getDisplayName(token, chain)
          .toLowerCase()
          .includes(queryLC);
        if (displayNameMatch) return true;

        const tokenAddress = isWrappedToken(token, chain)
          ? getTokenBridgeWrappedTokenAddressSync(token, chain)?.toString()
          : token.tokenId?.address;

        const tokenAddressMatch = tokenAddress
          ?.toString()
          .toLowerCase()
          .includes(queryLC);
        if (tokenAddressMatch) return true;

        return false;
      }}
      renderFn={(token: Token) => {
        const balance = balances?.[token.key]?.balance;
        const disabled =
          props.isSource && !!props.wallet?.address && !!balances && !balance;

        return (
          <TokenItem
            key={token.key}
            token={token}
            chain={props.selectedChainConfig.key}
            disabled={disabled}
            onClick={() => {
              props.onSelectToken(token);
            }}
            balance={balance}
            isFetchingBalance={isFetchingTokenBalances}
          />
        );
      }}
    />
  );

  return (
    <Card className={classes.card} variant="elevation">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title}>Select a token</Typography>
        {searchList}
      </CardContent>
    </Card>
  );
};

export default TokenList;
