import { entitlementFrom, isAdFree, periodLabel } from '../subscription';
import { feedAdAfter } from '../../ads/placement';

const DAY = 24 * 60 * 60 * 1000;
const base = { entitledUntil: null, everEntitled: false, now: 100 * DAY, graceDays: 3 };

describe('isAdFree', () => {
  it('follows live answers from the store', () => {
    expect(isAdFree({ ...base, status: 'active' })).toBe(true);
    expect(isAdFree({ ...base, status: 'inactive', everEntitled: true, entitledUntil: 200 * DAY })).toBe(false);
  });
  it('shows ads to never-subscribed devices while loading/offline, and where purchases are unavailable', () => {
    expect(isAdFree({ ...base, status: 'loading' })).toBe(false);
    expect(isAdFree({ ...base, status: 'offline' })).toBe(false);
    expect(isAdFree({ ...base, status: 'unavailable', everEntitled: true, entitledUntil: 200 * DAY })).toBe(false);
  });
  it('offline grace: verified expiry + 3 days, so subscribers never see ads just for being offline', () => {
    const offline = { ...base, status: 'offline' as const, everEntitled: true };
    expect(isAdFree({ ...offline, entitledUntil: 99 * DAY })).toBe(true);
    expect(isAdFree({ ...offline, entitledUntil: 96 * DAY })).toBe(false);
    expect(isAdFree({ ...offline, entitledUntil: null })).toBe(true);
  });
  it('no ad flash for subscribers while the first check loads', () => {
    expect(isAdFree({ ...base, status: 'loading', everEntitled: true, entitledUntil: 130 * DAY })).toBe(true);
  });
});

describe('entitlementFrom', () => {
  it('reads the ad_free entitlement', () => {
    const info = { entitlements: { active: { ad_free: { isActive: true, expirationDateMillis: 5, periodType: 'NORMAL', willRenew: true } } } };
    expect(entitlementFrom(info, 'ad_free')).toEqual({ isActive: true, expiresAt: 5, isTrial: false, willRenew: true });
    expect(entitlementFrom({ entitlements: { active: {} } }, 'ad_free').isActive).toBe(false);
  });
});

describe('periodLabel', () => {
  it.each([
    ['P1M', 'month'],
    ['P1Y', 'year'],
    ['P3M', '3 months'],
    [null, ''],
  ])('%p → %p', (iso, out) => expect(periodLabel(iso)).toBe(out));
});

describe('feedAdAfter', () => {
  it('places an ad after every 8th item, never as the last row', () => {
    const slots = Array.from({ length: 20 }, (_, i) => i).filter((i) => feedAdAfter(i, 20));
    expect(slots).toEqual([7, 15]);
    expect(Array.from({ length: 16 }, (_, i) => i).filter((i) => feedAdAfter(i, 16))).toEqual([7]);
    expect(Array.from({ length: 5 }, (_, i) => i).filter((i) => feedAdAfter(i, 5))).toEqual([]);
  });
});
