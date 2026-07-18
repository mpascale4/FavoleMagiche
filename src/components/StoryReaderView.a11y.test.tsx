import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import StoryReaderView from './StoryReaderView';
import type { Story, AppSettings } from '../types';

expect.extend(toHaveNoViolations);

const storyFixture: Story = {
  id: 'sr1',
  titolo: 'Il Bosco Luminoso',
  pagine: [
    'C\'era una volta un bosco pieno di stelle gentili e sentieri colorati.',
    'Ogni notte, una piccola luce aiutava i cuccioli a ritrovare la strada di casa.',
  ],
  morale: 'La gentilezza illumina sempre il cammino.',
  data: new Date().toISOString(),
  durata: 'Breve',
  categoria: 'Natura',
  temaEducativo: 'Gentilezza',
  preferita: false,
  coverTheme: 'forest',
  coverColor: 'pastel-green',
  copertinaDescrizione: 'Una foresta verde con lucciole luminose.',
};

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

describe('StoryReaderView accessibility', () => {
  it('renders primary reader controls with accessible names', () => {
    render(
      <StoryReaderView
        story={storyFixture}
        isPremium={false}
        settings={settingsFixture}
        onUpdateSettings={vi.fn()}
        onToggleFavorite={vi.fn()}
        activeProfile={null}
        onBack={vi.fn()}
        onContinueStory={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Torna alla schermata precedente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apri opzioni di condivisione favola/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aggiungi ai preferiti/i })).toBeInTheDocument();
  });

  it('opens share modal as accessible dialog', async () => {
    const user = userEvent.setup();

    render(
      <StoryReaderView
        story={storyFixture}
        isPremium={false}
        settings={settingsFixture}
        onUpdateSettings={vi.fn()}
        onToggleFavorite={vi.fn()}
        activeProfile={null}
        onBack={vi.fn()}
        onContinueStory={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Apri opzioni di condivisione favola/i }));

    expect(screen.getByRole('dialog', { name: /Condividi la tua Favola/i })).toBeInTheDocument();
  });

  it('has no critical axe violations', async () => {
    const { container } = render(
      <StoryReaderView
        story={storyFixture}
        isPremium={false}
        settings={settingsFixture}
        onUpdateSettings={vi.fn()}
        onToggleFavorite={vi.fn()}
        activeProfile={null}
        onBack={vi.fn()}
        onContinueStory={vi.fn()}
      />,
    );

    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });
});

