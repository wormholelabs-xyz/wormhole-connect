import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import config, { InternalConfig, buildConfig } from 'config';
import { Network } from '@wormhole-foundation/sdk';
import { WormholeConnectConfig } from '../config/types';

// Create a context with the config object
const ConfigContext = createContext<InternalConfig<Network> | undefined>(
  undefined,
);

interface ConfigProviderProps {
  children: ReactNode;
  customConfig?: WormholeConnectConfig;
}

// Provider component that wraps parts of the app that need access to the config
export const ConfigProvider = ({
  children,
  customConfig,
}: ConfigProviderProps) => {
  // Create the config instance synchronously for SSG compatibility
  const configValue = useMemo(() => {
    if (customConfig) {
      return buildConfig(customConfig);
    }
    return config;
  }, [customConfig]);

  return (
    <ConfigContext.Provider value={configValue}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the config
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return { config: context };
};
