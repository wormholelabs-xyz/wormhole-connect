import config from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setFetchingPrices,
  setPrices,
  setPricesError,
} from 'store/tokenPrices';
import { sleep } from 'utils';
import { Wormhole, TokenId, Chain } from '@wormhole-foundation/sdk';
import { tokenKey } from 'config/tokens';

const COINGECKO_URL = 'https://api.coingecko.com/';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com/';

export const useFetchTokenPrices = (tokens: TokenId[]): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const signal = controller.signal;

    const chainsAndAddresses = {};

    for (const token of tokens) {
      if (chainsAndAddresses[token.chain] === undefined) {
        chainsAndAddresses[token.chain] = [];
      }
      chainsAndAddresses[token.chain].push(token.address.toString());
    }

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(config.coinGeckoApiKey
        ? { 'x-cg-pro-api-key': config.coinGeckoApiKey }
        : {}),
    });
    const fetchTokenPrices = async () => {
      dispatch(setFetchingPrices());

      while (!cancelled) {
        let fetchInterval = 5 * 60 * 1000; // 5 mins

        const promises = Object.keys(chainsAndAddresses).map((chain) => {
          const addresses = chainsAndAddresses[chain];

          return new Promise(async (resolve, reject) => {
            const hostname = config.coinGeckoApiKey
              ? COINGECKO_URL_PRO
              : COINGECKO_URL;
            const apiKey = config.coinGeckoApiKey
              ? `&x_cg_pro_api_key=${config.coinGeckoApiKey}`
              : '';

            const resp = await fetch(
              `${hostname}api/v3/simple/token_price/${chain.toLowerCase()}?contract_addresses=${addresses.join(
                ',',
              )}&vs_currencies=usd${apiKey}`,
              { signal, headers },
            );

            const data = await resp.json();

            resolve({ chain, data });
          });
        });

        try {
          // Make API call to fetch token prices
          // In the case the user https://apiguide.coingecko.com/getting-started/getting-started#id-2.-making-api-request
          const results = (await Promise.all(promises)) as {
            chain: Chain;
            data: { [key: string]: { usd: number } };
          }[];

          const payload = {};
          for (const { chain, data } of results) {
            for (const addr in data) {
              const { usd } = data[addr];
              const key = tokenKey(Wormhole.tokenId(chain, addr));
              payload[key] = usd;
            }
          }

          if (!cancelled) {
            dispatch(setPrices(payload));
          }
        } catch (error) {
          if (!cancelled) {
            dispatch(setPricesError(`Error fetching token prices: ${error}`));
          }
          // If there was an error fetching token prices, retry in 30 seconds
          fetchInterval = 30 * 1000; // 30 seconds
        }
        await sleep(fetchInterval);
      }
    };

    fetchTokenPrices();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line
  }, [tokens.map((t) => t.address).join(',')]);
};
