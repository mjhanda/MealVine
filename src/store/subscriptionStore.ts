import { useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OFFLINE_GRACE_DAYS } from '../config/purchases';
import { EntitlementSnapshot, isAdFree, SubscriptionStatus } from '../utils/subscription';
import { isRecord, MigrationError, persistOptions } from './persistence';

// What the app knows about the ad-free subscription. Only the last *verified* expiry is persisted (for
// offline grace); the live status always comes from the store via src/services/purchases.ts.
// Deliberately NOT part of backups — an imported file must never remove ads.

interface PersistedSubscription {
  entitledUntil: number | null;
  everEntitled: boolean;
}

export const SUBSCRIPTION_VERSION = 1;

export function migrateSubscription(persisted: unknown, _fromVersion: number): PersistedSubscription {
  if (!isRecord(persisted)) throw new MigrationError('subscription: not an object');
  return {
    entitledUntil: typeof persisted.entitledUntil === 'number' ? persisted.entitledUntil : null,
    everEntitled: persisted.everEntitled === true,
  };
}

interface SubscriptionState extends PersistedSubscription {
  status: SubscriptionStatus;
  entitlement: EntitlementSnapshot | null;
  hasHydrated: boolean;
  // A verified answer from the store.
  setVerified: (entitlement: EntitlementSnapshot) => void;
  setStatus: (status: Exclude<SubscriptionStatus, 'active' | 'inactive'>) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      entitledUntil: null,
      everEntitled: false,
      status: 'loading',
      entitlement: null,
      hasHydrated: false,
      setVerified: (entitlement) =>
        set((state) => ({
          entitlement,
          status: entitlement.isActive ? 'active' : 'inactive',
          entitledUntil: entitlement.isActive ? entitlement.expiresAt : state.entitledUntil,
          everEntitled: state.everEntitled || entitlement.isActive,
        })),
      setStatus: (status) => set({ status }),
    }),
    persistOptions<SubscriptionState, PersistedSubscription>({
      name: 'mealplan:subscription',
      version: SUBSCRIPTION_VERSION,
      partialize: ({ entitledUntil, everEntitled }) => ({ entitledUntil, everEntitled }),
      migrate: migrateSubscription,
      onHydrated: () => useSubscriptionStore.setState({ hasHydrated: true }),
    })
  )
);

// True when ads should be hidden. `now` is captured per mount; the grace window is days long,
// so it doesn't need to tick.
export function useAdFree(): boolean {
  const status = useSubscriptionStore((s) => s.status);
  const entitledUntil = useSubscriptionStore((s) => s.entitledUntil);
  const everEntitled = useSubscriptionStore((s) => s.everEntitled);
  const [now] = useState(Date.now);
  return isAdFree({ status, entitledUntil, everEntitled, now, graceDays: OFFLINE_GRACE_DAYS });
}
