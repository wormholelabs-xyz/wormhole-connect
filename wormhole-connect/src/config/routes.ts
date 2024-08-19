import WormholeIcon from '../icons/Routes/Wormhole';
import XLabsIcon from '../icons/Routes/XLabs';
// import HashflowIcon from '../icons/Routes/Hashflow';
import CCTPIcon from '../icons/Routes/CCTP';

import { routes } from '@wormhole-foundation/sdk';
import {
  nttAutomaticRoute,
  nttManualRoute,
  NttRoute,
} from '@wormhole-foundation/sdk-route-ntt';

export const DEFAULT_ROUTES = [
  routes.TokenBridgeRoute,
  routes.AutomaticTokenBridgeRoute,
  routes.CCTPRoute,
  routes.AutomaticCCTPRoute,
];

// Convenience function for integrators when adding NTT routes to their config
//
// Example:
//
// routes: [
//   ...DEFAULT_ROUTES,
//   ...nttRoutes({ ... }),
// ]
export const nttRoutes = (nc: NttRoute.Config): routes.RouteConstructor[] => {
  return [nttManualRoute(nc), nttAutomaticRoute(nc)];
};

export type RouteData = {
  name: string; // Should match meta.name in RouteConstructor
  displayName: string; // Human-readable name
  providedBy: string;
  routePath?: string;
  link: string;
  icon: () => JSX.Element;
  pendingMessage: string;
};

// TODO SDKV2 REMOVE THIS, WE SHOULDNT HAVE THIS KIND OF INFORMATION IN CONNECT
export const RoutesConfig: Record<string, RouteData> = {
  ManualTokenBridge: {
    name: 'ManualTokenBridge',
    displayName: 'Manual Bridge',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  AutomaticTokenBridge: {
    name: 'AutomaticTokenBridge',
    displayName: 'Automatic Bridge',
    providedBy: 'xLabs',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  ManualCCTP: {
    name: 'ManualCCTP',
    displayName: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
    pendingMessage: 'Waiting for Circle attestation . . .',
  },
  AutomaticCCTP: {
    name: 'AutomaticCCTP',
    displayName: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
    pendingMessage: 'Waiting for Circle attestation . . .',
  },
  /*
  [Route.TBTC]: {
    route: Route.TBTC,
    name: 'tBTC',
    providedBy: 'Threshold',
    link: 'https://threshold.network/earn/btc',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.CosmosGateway]: {
    route: Route.CosmosGateway,
    name: 'Cosmos Gateway',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.ETHBridge]: {
    route: Route.ETHBridge,
    name: 'ETH Bridge',
    providedBy: 'xLabs',
    routePath: 'Wormhole',
    link: 'https://xlabs.xyz',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.wstETHBridge]: {
    route: Route.wstETHBridge,
    name: 'wstETH Bridge',
    providedBy: 'xLabs',
    routePath: 'Wormhole',
    link: 'https://xlabs.xyz',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  */
  ManualNtt: {
    name: 'ManualNtt',
    displayName: 'Native Token Transfer',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  AutomaticNtt: {
    name: 'AutomaticNtt',
    displayName: 'Native Token Transfer',
    providedBy: 'xLabs',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.Mayan]: {
    route: Route.Mayan,
    name: 'Mayan Swap',
    providedBy: 'Mayan Finance',
    link: 'https://mayan.finance/',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
};
