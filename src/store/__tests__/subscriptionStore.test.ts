import { MigrationError } from '../persistence';
import { migrateSubscription, useSubscriptionStore } from '../subscriptionStore';

beforeEach(() => useSubscriptionStore.setState({ entitledUntil: null, everEntitled: false, status: 'loading', entitlement: null }));

describe('subscription store', () => {
  it('records verified expiry and remembers past entitlement', () => {
    const { setVerified } = useSubscriptionStore.getState();
    setVerified({ isActive: true, expiresAt: 1000, isTrial: true, willRenew: true });
    expect(useSubscriptionStore.getState()).toMatchObject({ status: 'active', entitledUntil: 1000, everEntitled: true });
    setVerified({ isActive: false, expiresAt: null, isTrial: false, willRenew: false });
    // Inactive answers keep the last verified expiry (harmless: live 'inactive' always locks).
    expect(useSubscriptionStore.getState()).toMatchObject({ status: 'inactive', entitledUntil: 1000, everEntitled: true });
  });

  it('migrates defensively', () => {
    expect(migrateSubscription({ entitledUntil: 5, everEntitled: true }, 1)).toEqual({ entitledUntil: 5, everEntitled: true });
    expect(migrateSubscription({ entitledUntil: 'x' }, 1)).toEqual({ entitledUntil: null, everEntitled: false });
    expect(() => migrateSubscription(null, 1)).toThrow(MigrationError);
  });
});
