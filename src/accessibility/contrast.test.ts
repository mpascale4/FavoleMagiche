import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast';
import { darkTokens, lightTokens } from './tokens';

describe('WCAG contrast tokens', () => {
  it('light theme normal text has at least 4.5:1 contrast', () => {
    const ratio = contrastRatio(lightTokens.textPrimary, lightTokens.background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('dark theme normal text has at least 4.5:1 contrast', () => {
    const ratio = contrastRatio(darkTokens.textPrimary, darkTokens.background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('ui components keep at least 3:1 contrast', () => {
    const ratio = contrastRatio(lightTokens.primary, lightTokens.background);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});

