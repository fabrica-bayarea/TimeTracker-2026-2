import { describe, expect, it } from 'vitest';
import { formatLastRead, formatLastReadAt, formatQueryUpdatedAt } from './relativeTime';

describe('formatLastRead', () => {
  it.each([
    [32, '32s atrás'],
    [300, '5min atrás'],
    [4680, '1h 18min atrás'],
    [25200, '7h atrás'],
  ])('formats %i elapsed seconds', (seconds, expected) => {
    expect(formatLastRead(seconds)).toBe(expected);
  });

  it.each([undefined, null, Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'uses an unavailable label for %s',
    (seconds) => {
      expect(formatLastRead(seconds)).toBe('—');
    },
  );
});

describe('relative time based on API response receipt', () => {
  it('advances the reported age by elapsed session time without another request', () => {
    expect(formatLastReadAt(20, 1_000, 61_000)).toBe('1min atrás');
    expect(formatLastReadAt(20, 61_000, 1_000)).toBe('20s atrás');
  });

  it('falls back safely for invalid ages and receipt timestamps', () => {
    expect(formatLastReadAt(-1, 1_000, 61_000)).toBe('—');
    expect(formatLastReadAt(20, 'invalid', 61_000)).toBe('20s atrás');
    expect(formatLastReadAt(20, 1_000, Number.NaN)).toBe('20s atrás');
  });

  it('formats query receipt time in the configured São Paulo timezone', () => {
    expect(formatQueryUpdatedAt(Date.parse('2026-10-16T12:00:00Z'))).toMatch(/16\/10\/2026.*09:00/);
    expect(formatQueryUpdatedAt('2026-10-16T12:00:00Z')).toMatch(/16\/10\/2026.*09:00/);
    expect(formatQueryUpdatedAt(Number.NaN)).toBe('—');
  });
});
