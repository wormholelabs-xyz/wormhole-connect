import {
  Chain,
  TokenId,
  Wormhole,
  canonicalAddress,
  isTokenId,
  isChain,
  TokenAddress,
  toNative,
  isNative,
  isSameToken,
} from '@wormhole-foundation/sdk';
import { TokenConfig } from './types';
import { getWormholeContextV2 } from './index';

import { TokenId as TokenIdV1 } from 'sdklegacy/types';

export class Token {
  chain: Chain;
  address: TokenAddress<Chain>;
  decimals: number;
  symbol: string;

  // Display info
  //icon?: Icon | string;

  // Token bridge wrapped token
  wrappedToken?: TokenId;

  constructor(chain: Chain, address: string, decimals: number, symbol: string) {
    this.chain = chain;
    this.address = isNative(address) ? address : toNative(chain, address);
    this.decimals = decimals;
    this.symbol = symbol;
  }

  static async fromTokenId(tokenId: TokenId): Promise<Token> {
    const wh = await getWormholeContextV2();
    const chain = wh.getChain(tokenId.chain);
    const decimals = await chain.getDecimals(tokenId.address);
    // TODO add fetch symbol util to SDK
    const symbol = 'TODO';
    return new Token(
      tokenId.chain,
      canonicalAddress(tokenId),
      decimals,
      symbol,
    );
  }

  get display(): string {
    if (this.symbol !== '') {
      return this.symbol;
    }
    // TODO better handling here
    return this.address.toString();
  }

  get tuple(): TokenTuple {
    return [this.chain, this.address.toString()];
  }

  get key(): string {
    return tokenKey(this.tokenId);
  }

  get tokenId(): TokenId {
    return {
      chain: this.chain,
      address: this.address,
    };
  }

  // TODO remove
  get nativeChain(): Chain {
    return this.chain;
  }

  get icon(): any {
    return 'hi';
  }

  equals(other: Token): boolean {
    return isSameToken(this.tokenId, other.tokenId);
  }
}

export class TokenCache {
  // Mapping of Chain -> token address -> Token class instance
  private _tokens: Map<Chain, Map<string, Token>>;

  constructor() {
    this._tokens = new Map();
  }

  add(token: Token) {
    if (!this._tokens.has(token.chain)) {
      this._tokens.set(token.chain, new Map());
    }

    this._tokens.get(token.chain)?.set(token.address.toString(), token);
  }

  // You can get a token either using its string key, TokenId, or with (chain, address)
  get(key: string): Token | undefined;
  get(tokenId: TokenId): Token | undefined;
  get(tokenTuple: TokenTuple): Token | undefined;
  get(chain: Chain, address: string): Token | undefined;
  get(
    firstArg: Chain | string | TokenId | TokenTuple,
    address?: string,
  ): Token | undefined {
    if (isTokenTuple(firstArg)) {
      return this._tokens.get(firstArg[0])?.get(firstArg[1]);
    } else if (isTokenId(firstArg)) {
      return this._tokens.get(firstArg.chain)?.get(canonicalAddress(firstArg));
    } else if (isChain(firstArg) && address !== undefined) {
      return this._tokens.get(firstArg)?.get(address);
    } else {
      const { chain, address } = parseTokenKey(firstArg);
      return this._tokens.get(chain)?.get(address.toString());
    }
  }

  mustGet(key: string): Token;
  mustGet(tokenId: TokenId): Token;
  mustGet(tokenTuple: TokenTuple): Token;
  mustGet(chain: Chain, address: string): Token;
  mustGet(
    firstArg: Chain | string | TokenId | TokenTuple,
    address?: string,
  ): Token {
    // @ts-ignore - TS is complaining about this and I cant figure out why
    const t = this.get(firstArg, address);
    if (!t) {
      throw new Error('Failed to get token');
    }
    return t;
  }

  getList(keys: string[]): Token[];
  getList(keys: TokenId[]): Token[];
  getList(keys: TokenTuple[]): Token[];
  getList(keys: string[] | TokenId[] | TokenTuple[]): Token[] {
    return (
      keys
        // Typescript is throwing a fit here because of the overload in get()
        // but the code is type compliant. If you comment this out you can see
        // the ts error is nonsense.
        /* @ts-ignore */
        .map((k: string | TokenId) => this.get(k))
        .filter((t) => t !== undefined) as Token[]
    );
  }

  // Fetches token metadata (decimals, symbol)
  async getOrFetch(tokenId: TokenId): Promise<Token | undefined> {
    const cached = this.get(tokenId);
    if (cached) return cached;

    try {
      const t = await Token.fromTokenId(tokenId);
      this.add(t);
      return t;
    } catch (e) {
      console.log('error getting token', e);
      return undefined;
    }
  }

  // This should be used sparingly/never... use addresses instead.
  findBySymbol(chain: Chain, symbol: string): Token | undefined {
    return this.getAll(chain).find((t) => t.symbol === symbol);
  }

  getGasToken(chain: Chain): Token | undefined {
    if (chain === 'Celo') {
      // special case... Celo has multiple gas tokens (?!?!)
      return this.findBySymbol('Celo', 'CELO');
    }

    return this.get(chain, 'native');
  }

  getAll(chain?: Chain): Token[] {
    if (chain) {
      const chainTokens = this._tokens.get(chain);
      return chainTokens ? Array.from(chainTokens.values()) : [];
    } else {
      return Array.from(this._tokens.values()).flatMap((chainMap) =>
        Array.from(chainMap.values()),
      );
    }
  }
}

// Seed a new TokenCache using hard-coded tokens
export function buildTokenCache(...tokenLists: TokenConfig[][]): TokenCache {
  const cache = new TokenCache();
  for (const list of tokenLists) {
    for (const { tokenId, symbol } of list) {
      const token = new Token(
        tokenId.chain,
        tokenId.address.toString(),
        8,
        symbol,
      );
      cache.add(token);
    }
  }
  return cache;
}

// A JSON-serializable tuple containing a chain, and native address
export type TokenTuple = [Chain, string];

export function isTokenTuple(thing: any): thing is TokenTuple {
  return Array.isArray(thing) && thing.length == 2 && isChain(thing[0]);
}

export function tokenIdToTuple(tokenId: TokenId): TokenTuple {
  return [tokenId.chain, tokenId.address.toString()];
}

export function tokenIdFromTuple(tokenTuple: TokenTuple): TokenId {
  const chain = tokenTuple[0] as Chain;
  const address = isNative(tokenTuple[1])
    ? tokenTuple[1]
    : toNative(chain, tokenTuple[1]);
  return {
    chain,
    address,
  };
}

export function tokenKey(tokenId: TokenId): string {
  return JSON.stringify(tokenIdToTuple(tokenId));
}

export function parseTokenKey(key: string): TokenId {
  const tuple = JSON.parse(key) as TokenTuple;
  if (isTokenTuple(tuple)) {
    return tokenIdFromTuple(tuple);
  } else {
    throw new Error(`Invalid token key "${key}"; couldn't parse`);
  }
}

// TODO temporary code until we can finally get rid of legacy TokenId
export function ensureTokenIdV2(tokenId: TokenId | TokenIdV1): TokenId {
  if (typeof tokenId.address === 'string') {
    return Wormhole.tokenId(tokenId.chain, tokenId.address);
  } else if (isTokenId(tokenId)) {
    return tokenId;
  } else {
    throw new Error(`Bad input sorry`);
  }
}
