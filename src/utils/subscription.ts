// Pure subscription rules — no SDK imports, so they're testable and work offline.

const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionStatus =
  | 'loading' // waiting for the first answer from the store
  | 'active' // the store says the entitlement is active right now
  | 'inactive' // the store says it isn't
  | 'offline' // couldn't reach the store; fall back to the last verified expiry
  | 'unavailable'; // purchases can't run here (web, Expo Go, missing key)

export interface EntitlementSnapshot {
  isActive: boolean;
  expiresAt: number | null; // null = never expires (lifetime) or unknown
  isTrial: boolean;
  willRenew: boolean;
}

// The subset of RevenueCat's CustomerInfo we rely on.
export interface CustomerInfoLike {
  entitlements: {
    active: Record<string, { isActive: boolean; expirationDateMillis: number | null; periodType: string; willRenew: boolean } | undefined>;
  };
}

export function entitlementFrom(info: CustomerInfoLike, entitlementId: string): EntitlementSnapshot {
  const e = info.entitlements.active[entitlementId];
  if (!e || !e.isActive) return { isActive: false, expiresAt: null, isTrial: false, willRenew: false };
  return {
    isActive: true,
    expiresAt: e.expirationDateMillis,
    isTrial: e.periodType.toUpperCase() === 'TRIAL',
    willRenew: e.willRenew,
  };
}

interface AccessInput {
  status: SubscriptionStatus;
  entitledUntil: number | null; // last verified expiry, persisted
  everEntitled: boolean; // persisted: has this device ever had a verified active entitlement
  allowUnavailable: boolean; // dev builds and web: let the app run without a store
  now: number;
  graceDays: number;
}

// Decides whether the app is usable. Live answers from the store win; when the store can't be
// reached, a recently verified subscription keeps working for a short grace period. While the
// first answer is loading, a previously entitled device isn't blocked (no paywall flash).
export function hasAccess({ status, entitledUntil, everEntitled, allowUnavailable, now, graceDays }: AccessInput): boolean {
  switch (status) {
    case 'active':
      return true;
    case 'inactive':
      return false;
    case 'unavailable':
      return allowUnavailable;
    case 'loading':
    case 'offline':
      if (!everEntitled) return false;
      if (entitledUntil === null) return true; // non-expiring entitlement
      return now < entitledUntil + graceDays * DAY_MS;
  }
}

// --- Paywall labels ------------------------------------------------------------

const UNIT_LABEL: Record<string, [string, string]> = {
  DAY: ['day', 'days'],
  WEEK: ['week', 'weeks'],
  MONTH: ['month', 'months'],
  YEAR: ['year', 'years'],
};

// ISO 8601 period ("P1M", "P1Y", "P14D") → "month", "year", "14 days".
export function periodLabel(iso: string | null): string {
  const m = iso?.match(/^P(\d+)([DWMY])$/);
  if (!m) return '';
  const n = Number(m[1]);
  const unit = { D: 'DAY', W: 'WEEK', M: 'MONTH', Y: 'YEAR' }[m[2] as 'D' | 'W' | 'M' | 'Y'];
  const [one, many] = UNIT_LABEL[unit];
  return n === 1 ? one : `${n} ${many}`;
}

export interface IntroLike {
  price: number;
  periodUnit: string;
  periodNumberOfUnits: number;
  cycles: number;
}

// A free intro phase → "14-day free trial"; a paid intro or none → null.
export function trialLabel(intro: IntroLike | null): string | null {
  if (!intro || intro.price > 0) return null;
  const total = intro.periodNumberOfUnits * Math.max(1, intro.cycles);
  const unit = UNIT_LABEL[intro.periodUnit.toUpperCase()];
  if (!unit) return null;
  return `${total}-${unit[0]} free trial`;
}

// "$29.99/year" vs "$4.99/month" → "Save 50%". Null if not a saving.
export function annualSavings(monthlyPrice: number, annualPrice: number): string | null {
  if (monthlyPrice <= 0 || annualPrice <= 0) return null;
  const pct = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);
  return pct >= 5 ? `Save ${pct}%` : null;
}
