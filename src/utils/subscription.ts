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

interface AdFreeInput {
  status: SubscriptionStatus;
  entitledUntil: number | null; // last verified expiry, persisted
  everEntitled: boolean; // persisted: has this device ever had a verified active entitlement
  now: number;
  graceDays: number;
}

// Whether to hide ads. Live answers from the store win; when the store can't be reached (or
// hasn't answered yet), a recently verified subscriber stays ad-free through a short grace
// period, so paying users never see ads just because they're offline.
export function isAdFree({ status, entitledUntil, everEntitled, now, graceDays }: AdFreeInput): boolean {
  switch (status) {
    case 'active':
      return true;
    case 'inactive':
    case 'unavailable':
      return false;
    case 'loading':
    case 'offline':
      if (!everEntitled) return false;
      if (entitledUntil === null) return true; // non-expiring entitlement (e.g. lifetime code)
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

