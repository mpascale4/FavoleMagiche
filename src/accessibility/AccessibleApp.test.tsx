import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import AccessibleApp from './AccessibleApp';

expect.extend(toHaveNoViolations);

describe('AccessibleApp', () => {
  it('renders semantic landmarks', () => {
    render(<AccessibleApp />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menu principale' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('supports keyboard navigation and visible action controls', async () => {
    const user = userEvent.setup();
    render(<AccessibleApp />);

    await user.tab();
    const [skipLink] = screen.getAllByRole('link', { name: 'Salta al contenuto principale' });
    expect(skipLink).toHaveFocus();

    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: /Tema:/i })).toBeVisible();
  });

  it('shows validation error with icon and descriptive text', async () => {
    const user = userEvent.setup();
    render(<AccessibleApp />);

    const submitButton = screen.getByRole('button', { name: /\[\+\] Invia richiesta/i });
    await user.click(submitButton);

    expect(screen.getByText(/\[x\] Email obbligatoria/i)).toBeInTheDocument();
    expect(screen.getByText(/Inserire un indirizzo nel formato nome@dominio.com/i)).toBeInTheDocument();
  });

  it('opens and closes modal with keyboard escape', async () => {
    const user = userEvent.setup();
    render(<AccessibleApp />);

    await user.click(screen.getByRole('button', { name: /\[i\] Apri modal/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no critical axe violations', async () => {
    const { container } = render(<AccessibleApp />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});



