import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppState, Linking, Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL, PURCHASES_ERROR_CODE, PurchasesPackage } from 'react-native-purchases';
import { ENTITLEMENT_ID, revenueCatApiKey } from '../config/purchases';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { entitlementFrom } from '../utils/subscription';

// The only module that talks to RevenueCat. Everything else reads useSubscriptionStore.

let configured = false;

// Web isn't a store target, and Expo Go can't load the native purchases module.
const canRunPurchases = () =>
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

const applyInfo = (info: CustomerInfo) => useSubscriptionStore.getState().setVerified(entitlementFrom(info, ENTITLEMENT_ID));

export function initPurchases(): void {
  const apiKey = revenueCatApiKey();
  if (configured) return;
  if (!canRunPurchases() || !apiKey) {
    if (Platform.OS !== 'web') console.warn('[purchases] unavailable: ' + (apiKey ? 'Expo Go' : 'no RevenueCat key set'));
    useSubscriptionStore.getState().setStatus('unavailable');
    return;
  }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  configured = true;
  Purchases.addCustomerInfoUpdateListener(applyInfo);
  // Codes redeemed in the Play Store (or App Store settings) take effect when the user comes back.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') refreshSubscription();
  });
  refreshSubscription();
}

export async function refreshSubscription(): Promise<void> {
  if (!configured) return;
  try {
    applyInfo(await Purchases.getCustomerInfo());
  } catch (e) {
    console.warn('[purchases] could not fetch customer info', e);
    useSubscriptionStore.getState().setStatus('offline');
  }
}

export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export type PurchaseOutcome = { ok: true } | { ok: false; cancelled: boolean; message: string };

const failure = (e: unknown): PurchaseOutcome => {
  const err = e as { code?: string; message?: string; userCancelled?: boolean };
  const cancelled = err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || err.userCancelled === true;
  return { ok: false, cancelled, message: err.message ?? 'Something went wrong. Please try again.' };
};

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyInfo(customerInfo);
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function restore(): Promise<PurchaseOutcome & { found?: boolean }> {
  if (!configured) return { ok: false, cancelled: false, message: 'Purchases are not available on this device.' };
  try {
    const info = await Purchases.restorePurchases();
    applyInfo(info);
    return { ok: true, found: entitlementFrom(info, ENTITLEMENT_ID).isActive };
  } catch (e) {
    return failure(e);
  }
}

export async function manageSubscription(): Promise<void> {
  if (!configured) return;
  await Purchases.showManageSubscriptions().catch((e) => console.warn('[purchases] manage failed', e));
}

// Store-issued codes only (Apple Offer Codes / Google Play promo codes) — App Store guideline
// 3.1.1 forbids unlocking features with the app's own codes. iOS shows Apple's redemption sheet;
// Android opens the Play Store's redeem page, and the foreground refresh picks up the result.
export async function redeemCode(): Promise<void> {
  if (Platform.OS === 'ios' && configured) {
    await Purchases.presentCodeRedemptionSheet().catch((e) => console.warn('[purchases] redeem sheet failed', e));
    return;
  }
  if (Platform.OS === 'android') await Linking.openURL('https://play.google.com/redeem');
}
