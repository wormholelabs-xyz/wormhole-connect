import * as v1 from 'sdklegacy';
import * as v2 from '@wormhole-foundation/sdk';
import { Chain } from '@wormhole-foundation/sdk';

// SDKConverter provides utility functions for converting core types between SDKv1 and SDKv2
// This is only meant to be used while we transition to SDKv2
export class SDKConverter {
  wh: v1.WormholeContext;

  constructor(wh: v1.WormholeContext) {
    this.wh = wh;
  }

  // Token conversion
  toTokenIdV1(token: v2.TokenId): v1.TokenId | undefined {
    if (token.address === 'native') {
      // In Connect's legacy code, native tokens don't have a tokenId
      return undefined;
    } else {
      return {
        chain: token.chain,
        address: token.address.toString(),
      };
    }
  }

  tokenIdV2<C extends Chain>(chain: C, address: string): v2.TokenId<C> {
    return v2.Wormhole.tokenId(chain, address);
  }
}
