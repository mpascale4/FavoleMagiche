import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast';

const palette = {
  lightBg: '#FFFFFF',
  lightSurface: '#F8FAFC',
  darkBg: '#111827',
  darkSurface: '#1F2937',
  textPrimaryLight: '#1F2937',
  textSecondaryLight: '#4B5563',
  textPrimaryDark: '#F9FAFB',
  textSecondaryDark: '#D1D5DB',
  primaryLight: '#1D4ED8',
  primaryDark: '#60A5FA',
  successLight: '#059669',
  warningLight: '#D97706',
  errorLight: '#DC2626',
  successDark: '#34D399',
  warningDark: '#FBBF24',
  errorDark: '#F87171',
};

describe('Theme contrast audit', () => {
  it('ensures body text pairs meet WCAG AA in light and dark', () => {
    expect(contrastRatio(palette.textPrimaryLight, palette.lightBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.textSecondaryLight, palette.lightBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.textPrimaryDark, palette.darkBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.textSecondaryDark, palette.darkBg)).toBeGreaterThanOrEqual(4.5);
  });

  it('ensures primary action colors meet 3:1 for UI components', () => {
    expect(contrastRatio(palette.primaryLight, palette.lightBg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.primaryDark, palette.darkBg)).toBeGreaterThanOrEqual(3);
  });

  it('ensures semantic status colors remain distinguishable on surfaces', () => {
    expect(contrastRatio(palette.successLight, palette.lightSurface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.warningLight, palette.lightSurface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.errorLight, palette.lightSurface)).toBeGreaterThanOrEqual(3);

    expect(contrastRatio(palette.successDark, palette.darkSurface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.warningDark, palette.darkSurface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.errorDark, palette.darkSurface)).toBeGreaterThanOrEqual(3);
  });
});

