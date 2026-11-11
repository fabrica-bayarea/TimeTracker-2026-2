import { describe, expect, it } from 'vitest';
import { fmtDuration } from './duration';

describe('fmtDuration', () => {
  it('formats whole hours and minutes, including a numeric string', () => {
    expect(fmtDuration()).toBe('0h 00min');
    expect(fmtDuration(3599)).toBe('0h 59min');
    expect(fmtDuration('3600')).toBe('1h 00min');
    expect(fmtDuration(15)).toBe('15s');
    expect(fmtDuration(59)).toBe('59s');
    expect(fmtDuration(60)).toBe('0h 01min');
  });

  it('returns an em dash for negative, fractional, unsafe or non-finite values', () => {
    expect(fmtDuration(-1)).toBe('—');
    expect(fmtDuration('invalid')).toBe('—');
    expect(fmtDuration(Infinity)).toBe('—');
    expect(fmtDuration(1.5)).toBe('—');
    expect(fmtDuration(Number.MAX_SAFE_INTEGER + 1)).toBe('—');
  });
});
