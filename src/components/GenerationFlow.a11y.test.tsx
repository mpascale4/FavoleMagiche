import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import GenerationErrorModal from './GenerationErrorModal';
import GenerationView from './GenerationView';

expect.extend(toHaveNoViolations);

describe('Generation flow accessibility', () => {
  it('exposes progressbar and action buttons in generation view', () => {
    render(
      <GenerationView
        categoria="Fantasy"
        temaEducativo="Gentilezza"
        progress={42}
        step="Preparazione"
        onCancel={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar', { name: /Avanzamento generazione favola/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continua in background e torna alla Home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Annulla la generazione in corso/i })).toBeInTheDocument();
  });

  it('renders generation error as accessible dialog', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <GenerationErrorModal
        title="Errore"
        message="Errore durante la generazione"
        reason="Test reason"
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('dialog', { name: /Errore/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Chiudi errore e torna indietro/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('has no critical axe violations in modal', async () => {
    const { container } = render(
      <GenerationErrorModal
        title="Errore"
        message="Errore durante la generazione"
        reason="Test reason"
        onCancel={vi.fn()}
      />,
    );

    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });
});

