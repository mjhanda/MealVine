import { Platform } from 'react-native';

// RevenueCat setup. Public SDK keys are safe to ship in the app, but they live in env vars
// (EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY, see .env.example) so dev/test/prod
// keys can differ per build. Never put the RevenueCat *secret* key anywhere in this repo.

// Dishcart is free with ads. The only subscription ($0.99/month, no trial, no annual plan)
// grants this entitlement, which removes ads. Store-issued offer/promo codes grant it too.
export const ENTITLEMENT_ID = 'ad_free';

// Keeps access working through short offline stretches after the last verified expiry.
export const OFFLINE_GRACE_DAYS = 3;

export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// TODO(#21): replace with the hosted privacy policy once it's published.
export const PRIVACY_URL = 'https://github.com/mjhanda/Dishcart/blob/main/docs/release/privacy-policy.md';

export function revenueCatApiKey(): string | null {
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
    default: undefined,
  });
  return key && key.length > 0 ? key : null;
}
