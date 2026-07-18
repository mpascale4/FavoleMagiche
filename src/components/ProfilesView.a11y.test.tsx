import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ProfilesView from './ProfilesView';

expect.extend(toHaveNoViolations);

describe('ProfilesView accessibility', () => {
  it('supports keyboard activation for profile selection', async () => {
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    render(
      <ProfilesView
        profiles={[{ id: 'p1', nome: 'Luca', annoNascita: 2018, temaVisivo: '🌸 Giardino delle Fate' }]}
        activeProfile={null}
        onSelectProfile={onSelectProfile}
        onAddProfile={vi.fn()}
        onDeleteProfile={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const profileButton = screen.getByRole('button', { name: /Seleziona profilo Luca/i });
    profileButton.focus();
    await user.keyboard('{Enter}');

    expect(onSelectProfile).toHaveBeenCalledTimes(1);
  });

  it('shows a descriptive error when profile name is missing', async () => {
    const user = userEvent.setup();

    render(
      <ProfilesView
        profiles={[]}
        activeProfile={null}
        onSelectProfile={vi.fn()}
        onAddProfile={vi.fn()}
        onDeleteProfile={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Apri modulo per aggiungere un nuovo profilo/i }));
    await user.click(screen.getByRole('button', { name: /Salva Profilo/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Inserisci il nome del bambino/i);
  });

  it('has no critical axe violations', async () => {
    const { container } = render(
      <ProfilesView
        profiles={[]}
        activeProfile={null}
        onSelectProfile={vi.fn()}
        onAddProfile={vi.fn()}
        onDeleteProfile={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });
});


