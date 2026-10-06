// One ad after every Nth recipe in a list, never after the last item (no ad as the final row).
export const FEED_AD_EVERY = 8;

export const feedAdAfter = (index: number, total: number, every: number = FEED_AD_EVERY): boolean =>
  (index + 1) % every === 0 && index < total - 1;
