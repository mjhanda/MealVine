import { Platform } from 'react-native';

// RevenueCat setup. Public SDK keys are safe to ship in the app, but they live in env vars
// (EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY, see .env.example) so dev/test/prod
// keys can differ per build. Never put the RevenueCat *secret* key anywhere in this repo.

// The single entitlement every MealVine subscription grants.
export const ENTITLEMENT_ID = 'pro';

// Keeps access working through short offline stretches after the last verified expiry.
export const OFFLINE_GRACE_DAYS = 3;

export const TRIAL_DAYS = 14;

export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// TODO(#21): replace with the hosted privacy policy once it's published.
export const PRIVACY_URL = 'https://github.com/mjhanda/MealVine/blob/main/docs/release/privacy-policy.md';

export function revenueCatApiKey(): string | null {
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
    default: undefined,
  });
  return key && key.length > 0 ? key : null;
}
