import type { Moment } from 'moment';

/**
 * Joins address parts the same way `InboundTopCard` displays a user's
 * location (`"barangay, city, province"`), skipping any missing segment.
 */
export function formatDestination(
  barangay?: string | null,
  city?: string | null,
  province?: string | null,
): string {
  return [barangay, city, province].filter(Boolean).join(', ');
}

/**
 * Formats a captured scan instant for display, e.g. "Jul 15, 2026 · 2:34 PM".
 * Always pass the same `moment()` instant used to build the scan payload sent
 * to the server so the displayed time and the recorded time never drift.
 */
export function formatScanTime(instant: Moment): string {
  return instant.format('MMM D, YYYY · h:mm A');
}

export const SCAN_LOADING_TEXT = {
  VALIDATING: 'Validating parcel...',
  FETCHING: 'Fetching parcel information...',
  SAVING: 'Saving scan record...',
} as const;
