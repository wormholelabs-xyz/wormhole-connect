import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import './App.css';
import { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transferInput';
import { usePrevious } from './utils';
import { useConfig } from './contexts/ConfigContext';

import Terms from './views/Terms';
import TxSearch from './views/TxSearch';
import { setRoute } from './store/router';
import { clearWallets } from './store/wallet';
import { useExternalSearch } from 'hooks/useExternalSearch';

import BridgeV2 from 'views/v2/Bridge';
import RedeemV2 from 'views/v2/Redeem';
import TxHistory from 'views/v2/TxHistory';
import { RouteContext } from 'contexts/RouteContext';

const useStyles = makeStyles()((theme: any) => ({
  appContent: {
    textAlign: 'left',
    margin: '40px auto',
    maxWidth: '900px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '4px',
    fontFamily: theme.palette.font.primary,
    [theme.breakpoints.down('sm')]: {
      margin: '0 auto',
    },
  },
}));

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const routeContext = useContext(RouteContext);
  const { config } = useConfig();

  // Initial load event
  React.useEffect(() => {
    config.triggerEvent({
      type: 'load',
      config,
    });
  }, []);

  const route = useSelector((state: RootState) => state.router.route);
  const prevRoute = usePrevious(route);
  const { hasExternalSearch } = useExternalSearch();
  useEffect(() => {
    const redeemRoute = 'redeem';
    const bridgeRoute = 'bridge';
    // reset redeem state on leave
    if (prevRoute === redeemRoute && route !== redeemRoute) {
      dispatch(clearRedeem());
      dispatch(clearWallets());
      routeContext.clear();
      config.whLegacy.registerProviders(); // reset providers that may have been set during transfer
    }
    // reset transfer state on leave
    const isEnteringBridge = route === bridgeRoute && prevRoute !== bridgeRoute;
    if (isEnteringBridge && prevRoute !== 'history') {
      dispatch(clearTransfer());
    }
  }, [route, prevRoute, dispatch]);

  useEffect(() => {
    if (hasExternalSearch) {
      dispatch(clearRedeem());
      dispatch(setRoute('search'));
    }
  }, [hasExternalSearch, dispatch]);

  return (
    <div className={classes.appContent}>
      {route === 'bridge' && <BridgeV2 />}
      {route === 'redeem' && <RedeemV2 />}
      {route === 'search' && <TxSearch />}
      {route === 'history' && <TxHistory />}
      {route === 'terms' && <Terms />}
    </div>
  );
}

export default AppRouter;
