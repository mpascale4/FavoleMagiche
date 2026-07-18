import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SettingsView from './SettingsView';
import type { AppSettings } from '../types';

expect.extend(toHaveNoViolations);

const settingsFixture: AppSettings = {
  sogliaSpazio: '1 GB',
  avvisaSuperamento: true,
  eliminaInAutomatico: false,
  conservaPreferite: true,
  pinAccesso: '1234',
  tipoVoce: 'narratore',
  nomeVoceDispositivo: '',
  velocitaVoce: 0.85,
  tonoVoce: 1,
  musicaSottofondo: true,
  effettiAudio: true,
  audioAdattivo: true,
  pauseMusicaliChiave: true,
  stileVisuale: 'auto',
  modalitaBambino: false,
  timerNannaMinutes: 0,
};

describe('SettingsView accessibility', () => {
  it('exposes the main navigation action and security switch', async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();

    render(
      <SettingsView
        settings={settingsFixture}
        storiesCount={3}
        geminiRuntimeStatus={{ state: 'unknown', message: 'Nessun test', updatedAt: undefined, model: undefined }}
        onUpdateSettings={onUpdateSettings}
        onClearArchive={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Torna alla schermata Home/i })).toBeInTheDocument();

    const kidsModeSwitch = screen.getByRole('switch', { name: /Attiva o disattiva modalita bambino/i });
    await user.click(kidsModeSwitch);

    expect(onUpdateSettings).toHaveBeenCalledWith({ modalitaBambino: true });
  });

  it('opens archive clear confirmation as dialog', async () => {
    const user = userEvent.setup();

    render(
      <SettingsView
        settings={settingsFixture}
        storiesCount={3}
        geminiRuntimeStatus={{ state: 'unknown', message: 'Nessun test', updatedAt: undefined, model: undefined }}
        onUpdateSettings={vi.fn()}
        onClearArchive={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Apri conferma svuota archivio storie/i }));
    expect(screen.getByRole('dialog', { name: /Svuotare l'intera biblioteca/i })).toBeInTheDocument();
  });

  it('has no critical axe violations', async () => {
    const { container } = render(
      <SettingsView
        settings={settingsFixture}
        storiesCount={0}
        geminiRuntimeStatus={{ state: 'unknown', message: 'Nessun test', updatedAt: undefined, model: undefined }}
        onUpdateSettings={vi.fn()}
        onClearArchive={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });
});

