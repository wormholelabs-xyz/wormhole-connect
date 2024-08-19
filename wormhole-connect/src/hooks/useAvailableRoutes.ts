import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';

import { RouteState, setRoutes } from 'store/transferInput';
import RouteOperator from 'routes/operator';

import type { RootState } from 'store';

const useAvailableRoutes = (): void => {
  const dispatch = useDispatch();

  const { token, destToken, fromChain, toChain, amount } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const [debouncedAmount] = useDebounce(amount, 500);

  useEffect(() => {
    if (!fromChain || !toChain || !token || !destToken) {
      return;
    }

    let isActive = true;

    const getAvailable = async () => {
      const routes: RouteState[] = [];
      await RouteOperator.forEach(async (name, route) => {
        let supported = false;
        let available = false;
        let availabilityError = '';

        try {
          supported = await route.isRouteSupported(
            token,
            destToken,
            debouncedAmount,
            fromChain,
            toChain,
          );
        } catch (e) {
          console.error('Error when checking route is supported:', e, name);
        }

        // Check availability of a route only when it is supported
        // Primary goal here is to prevent any unnecessary RPC calls
        if (supported) {
          try {
            available = await route.isRouteAvailable(
              token,
              destToken,
              debouncedAmount,
              fromChain,
              toChain,
              { nativeGas: toNativeToken },
            );
          } catch (e) {
            console.error('Error when checking route is available:', e, name);
          }
        }

        routes.push({ name, supported, available });
      });

      if (isActive) {
        dispatch(setRoutes(routes));
      }
    };

    getAvailable();

    return () => {
      isActive = false;
    };
  }, [
    dispatch,
    token,
    destToken,
    debouncedAmount,
    fromChain,
    toChain,
    toNativeToken,
  ]);
};

export default useAvailableRoutes;
