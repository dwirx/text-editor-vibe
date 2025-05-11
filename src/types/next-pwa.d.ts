declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    runtimeCaching?: any[];
    publicExcludes?: string[];
    buildExcludes?: string[];
    dynamicStartUrl?: boolean;
  }
  
  export default function withPWA(pwaConfig?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
} 