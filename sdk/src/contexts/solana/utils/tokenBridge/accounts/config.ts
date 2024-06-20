import {
  Connection,
  PublicKey,
  Commitment,
  PublicKeyInitData,
} from '@solana/web3.js';
import { deriveAddress, getAccountData } from '../../utils';
export function deriveTokenBridgeConfigKey(
  tokenBridgeProgramId: PublicKeyInitData,
): PublicKey {
  return deriveAddress([Buffer.from('config')], tokenBridgeProgramId);
}
export class TokenBridgeConfig {
  wormhole: PublicKey;
  constructor(wormholeProgramId: Buffer) {
    this.wormhole = new PublicKey(wormholeProgramId);
  }
  static deserialize(data: Buffer): TokenBridgeConfig {
    if (data.length != 32) {
      throw new Error('data.length != 32');
    }
    const wormholeProgramId = data.subarray(0, 32);
    return new TokenBridgeConfig(wormholeProgramId);
  }
}
