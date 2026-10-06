const DAY_MS = 24 * 60 * 60 * 1000;

// "Today", "Yesterday", "3 days ago", "2 weeks ago" — by whole days elapsed.
export function cookedAgo(cookedAt: number, now: number): string {
  const days = Math.floor((now - cookedAt) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}
