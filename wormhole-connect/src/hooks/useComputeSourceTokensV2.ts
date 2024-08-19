import config from 'config';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { setToken } from 'store/transferInput';

import type { TokenConfig } from 'config/types';

import RouteOperator from 'routes/operator';

import { Chain } from '@wormhole-foundation/sdk';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  route?: string;
};

type returnProps = {
  supportedTokens: Array<TokenConfig>;
  isFetching: boolean;
};

const useComputeSourceTokensV2 = (props: Props): returnProps => {
  const { sourceChain, destChain, sourceToken, destToken, route } = props;

  const dispatch = useDispatch();

  const [supportedTokens, setSupportedTokens] = useState<Array<TokenConfig>>(
    [],
  );
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!sourceChain) {
      return;
    }

    let active = true;

    const computeSrcTokens = async () => {
      let supported: Array<TokenConfig> = [];

      setIsFetching(true);

      try {
        supported = await RouteOperator.allSupportedSourceTokens(
          config.tokens[destToken],
          sourceChain,
          destChain,
        );
      } catch (e) {
        console.error(e);
      } finally {
        setIsFetching(false);
      }

      if (active) {
        setSupportedTokens(supported);
        const isTokenSupported =
          sourceToken && supported.some((t) => t.key === sourceToken);
        if (!isTokenSupported) {
          setToken('');
        }
        if (supported.length === 1 && sourceToken === '') {
          setToken(supported[0].key);
        }
      }
    };

    computeSrcTokens();

    return () => {
      active = false;
    };
    // IMPORTANT: do not include sourceToken in dependency array
  }, [route, sourceChain, destToken, dispatch]);

  return {
    supportedTokens,
    isFetching,
  };
};

export default useComputeSourceTokensV2;
