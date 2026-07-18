import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ArchiveView from './ArchiveView';
import type { Story } from '../types';

expect.extend(toHaveNoViolations);

const storyFixture: Story = {
  id: 's1',
  titolo: 'La Storia della Luna',
  pagine: ['Pagina 1'],
  morale: 'Morale test',
  data: new Date().toISOString(),
  dataCreazione: new Date().toISOString(),
  durata: 'Breve',
  categoria: 'Fantasy',
  temaEducativo: 'Gentilezza',
  preferita: false,
  coverTheme: 'forest',
  coverColor: 'pastel-blue',
  copertinaDescrizione: 'Copertina test',
};

describe('ArchiveView accessibility', () => {
  it('opens delete confirmation dialog with accessible name', async () => {
    const user = userEvent.setup();

    render(
      <ArchiveView
        stories={[storyFixture]}
        onSelectStory={vi.fn()}
        onDeleteStory={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Sposta nel cestino la favola/i }));

    expect(screen.getByRole('dialog', { name: /Spostare nel cestino/i })).toBeInTheDocument();
  });

  it('supports keyboard activation on story card', async () => {
    const user = userEvent.setup();
    const onSelectStory = vi.fn();

    render(
      <ArchiveView
        stories={[storyFixture]}
        onSelectStory={onSelectStory}
        onDeleteStory={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const storyButton = screen.getByRole('button', { name: /Apri favola La Storia della Luna/i });
    storyButton.focus();
    await user.keyboard('{Enter}');

    expect(onSelectStory).toHaveBeenCalledTimes(1);
  });

  it('has no critical axe violations', async () => {
    const { container } = render(
      <ArchiveView
        stories={[storyFixture]}
        onSelectStory={vi.fn()}
        onDeleteStory={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });
});

