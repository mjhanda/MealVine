import { ComponentType } from 'react';

// Where ads may appear. Deliberately never: onboarding, cooking mode, settings, the grocery list
// while shopping, or any dialog. Add a placement here before using it anywhere.
export type AdPlacement = 'browse-feed' | 'recipe-detail' | 'plan-footer';

// The contract an ad network adapter fulfils (e.g. a future src/ads/admob.ts wrapping
// react-native-google-mobile-ads). Keeping the SDK behind this interface means screens never
// import an ad SDK directly, and swapping networks touches one file.
export interface AdProvider {
  name: string;
  // Consent (ATT on iOS, UMP/GDPR) and SDK start-up happen here, before any ad renders.
  init: () => Promise<void>;
  // Renders a banner for a placement; should render nothing if no ad fills.
  Banner: ComponentType<{ placement: AdPlacement }>;
}
