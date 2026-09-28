import { describe, it, expect } from 'vitest';
import { resolveTheme, normalizePreference } from '../packages/theme/src/theme';
describe('theme preferences', () => {
  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
  ] as const)('%s with system dark=%s resolves to %s', (value, dark, expected) => {
    expect(resolveTheme(value, dark)).toBe(expected);
  });
  it('rejects invalid storage values', () => {
    expect(normalizePreference('invalid')).toBe('system');
    expect(normalizePreference(null)).toBe('system');
  });
});
