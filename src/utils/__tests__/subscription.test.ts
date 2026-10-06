import { annualSavings, entitlementFrom, hasAccess, periodLabel, trialLabel } from '../subscription';

const DAY = 24 * 60 * 60 * 1000;
const base = { entitledUntil: null, everEntitled: false, allowUnavailable: false, now: 100 * DAY, graceDays: 3 };

describe('hasAccess', () => {
  it('follows live answers from the store', () => {
    expect(hasAccess({ ...base, status: 'active' })).toBe(true);
    expect(hasAccess({ ...base, status: 'inactive', everEntitled: true, entitledUntil: 200 * DAY })).toBe(false);
  });
  it('never unlocks a device that was never entitled while loading/offline', () => {
    expect(hasAccess({ ...base, status: 'loading' })).toBe(false);
    expect(hasAccess({ ...base, status: 'offline' })).toBe(false);
  });
  it('offline grace: verified expiry + 3 days', () => {
    const offline = { ...base, status: 'offline' as const, everEntitled: true };
    expect(hasAccess({ ...offline, entitledUntil: 99 * DAY })).toBe(true); // 1 day past expiry
    expect(hasAccess({ ...offline, entitledUntil: 96 * DAY })).toBe(false); // 4 days past
    expect(hasAccess({ ...offline, entitledUntil: null })).toBe(true); // non-expiring
  });
  it('no paywall flash for subscribers while the first check loads', () => {
    expect(hasAccess({ ...base, status: 'loading', everEntitled: true, entitledUntil: 130 * DAY })).toBe(true);
  });
  it('unavailable only unlocks dev/web', () => {
    expect(hasAccess({ ...base, status: 'unavailable' })).toBe(false);
    expect(hasAccess({ ...base, status: 'unavailable', allowUnavailable: true })).toBe(true);
  });
});

describe('entitlementFrom', () => {
  it('reads the active entitlement, trial flag, and expiry', () => {
    const info = { entitlements: { active: { pro: { isActive: true, expirationDateMillis: 5, periodType: 'TRIAL', willRenew: true } } } };
    expect(entitlementFrom(info, 'pro')).toEqual({ isActive: true, expiresAt: 5, isTrial: true, willRenew: true });
    expect(entitlementFrom(info, 'other').isActive).toBe(false);
    expect(entitlementFrom({ entitlements: { active: {} } }, 'pro').isActive).toBe(false);
  });
});

describe('paywall labels', () => {
  it.each([
    ['P1M', 'month'],
    ['P1Y', 'year'],
    ['P1W', 'week'],
    ['P3M', '3 months'],
    [null, ''],
  ])('periodLabel(%p) = %p', (iso, out) => expect(periodLabel(iso)).toBe(out));

  it('trialLabel: free intro → "14-day free trial"; paid intro or none → null', () => {
    expect(trialLabel({ price: 0, periodUnit: 'DAY', periodNumberOfUnits: 14, cycles: 1 })).toBe('14-day free trial');
    expect(trialLabel({ price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1, cycles: 2 })).toBe('2-week free trial');
    expect(trialLabel({ price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1, cycles: 1 })).toBeNull();
    expect(trialLabel(null)).toBeNull();
  });

  it('annualSavings', () => {
    expect(annualSavings(4.99, 29.99)).toBe('Save 50%');
    expect(annualSavings(4.99, 59.88)).toBeNull();
    expect(annualSavings(0, 10)).toBeNull();
  });
});
