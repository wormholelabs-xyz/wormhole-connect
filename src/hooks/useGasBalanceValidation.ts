import { useMemo } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import config from 'config';
import type { QuoteResult } from 'routes/operator';
import type { Balances } from 'utils/wallet/types';

interface UseGasBalanceValidationParams {
  sourceChain?: Chain;
  quote?: QuoteResult;
  balances: Balances;
  isFetching: boolean;
}

interface UseGasBalanceValidationResult {
  error: string;
  isValidating: boolean;
}

const useGasBalanceValidation = ({
  sourceChain,
  quote,
  balances,
  isFetching,
}: UseGasBalanceValidationParams): UseGasBalanceValidationResult => {
  const error = useMemo(() => {
    // TESTING: Force low balance error
    const TEST_MODE = true;
    
    if (
      !sourceChain ||
      !quote ||
      isFetching ||
      !quote?.success ||
      (!quote?.relayFee && !TEST_MODE)
    ) {
      return '';
    }

    const chainConfig = config.chains[sourceChain];
    const nativeTokenKey = `${sourceChain}-native`;
    const nativeBalance = balances[nativeTokenKey]?.balance;

    // Can't validate without chain config or native balance (unless in test mode)
    if (!chainConfig || (!nativeBalance && !TEST_MODE)) {
      return '';
    }

    // In test mode, use fake balance if no real balance exists
    const testBalance = TEST_MODE ? sdkAmount.parse("0.001", 18) : null;
    const balanceToUse = nativeBalance || testBalance;
    
    const nativeBalanceUnits = balanceToUse ? sdkAmount.units(balanceToUse) : 0n;
    const relayFeeUnits = quote.relayFee ? sdkAmount.units(quote.relayFee.amount) : 0n;

    const fakeNativeBalance = TEST_MODE ? 0n : nativeBalanceUnits;

    // In test mode, always show error with a fake fee if no relay fee exists
    if (TEST_MODE && relayFeeUnits === 0n) {
      const nativeTokenSymbol = chainConfig.symbol || 'native token';
      return `Insufficient ${nativeTokenSymbol} for gas. You have 0.001 but need at least 0.01 (TEST MODE)`;
    }

    if (relayFeeUnits > 0n && fakeNativeBalance < relayFeeUnits) {
      const nativeTokenSymbol = chainConfig.symbol || 'native token';
      const currentBalance = TEST_MODE ? '0.001' : sdkAmount.display(balanceToUse);
      const requiredFee = sdkAmount.display(quote.relayFee.amount);

      return `Insufficient ${nativeTokenSymbol} for gas. You have ${currentBalance} but need at least ${requiredFee}`;
    }

    return '';
  }, [sourceChain, quote, balances, isFetching]);

  return {
    error,
    isValidating: isFetching,
  };
};

export default useGasBalanceValidation;
