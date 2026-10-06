import { AdProvider } from './types';

// No ad network is wired up yet, so no ads render and no ad SDK collects anything.
// To enable ads: implement an AdProvider and call registerAdProvider() once at startup
// (in App.tsx), after updating the privacy policy and store privacy answers.
let provider: AdProvider | null = null;

export function registerAdProvider(next: AdProvider): void {
  provider = next;
  next.init().catch((e) => {
    console.warn(`[ads] ${next.name} failed to start; ads disabled`, e);
    provider = null;
  });
}

export const getAdProvider = (): AdProvider | null => provider;

// Dev-only dashed boxes showing where ads would go. Off in release builds; set
// EXPO_PUBLIC_SHOW_AD_PLACEHOLDERS=0 to hide them in dev too.
export const showAdPlaceholders = (): boolean => __DEV__ && process.env.EXPO_PUBLIC_SHOW_AD_PLACEHOLDERS !== '0';
