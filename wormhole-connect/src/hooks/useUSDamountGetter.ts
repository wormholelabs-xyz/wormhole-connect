import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { getTokenPrice } from 'utils';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { Token } from 'config/tokens';

export const useUSDamountGetter = (): ((args: {
  token: Token;
  amount: sdkAmount.Amount;
}) => number | undefined) => {
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);

  return useCallback(
    ({ token, amount }) => {
      const prices = data || {};
      const numericAmount = sdkAmount.whole(amount);
      if (!token) return undefined;
      const tokenPrice = Number(getTokenPrice(prices, token));
      const USDAmount = tokenPrice * numericAmount;

      return isNaN(USDAmount) ? undefined : parseFloat(USDAmount.toFixed(2));
    },
    [data],
  );
};
