// @vitest-environment jsdom
/*
 * The New page dialog: the note that explains what Create will do (or what is wrong with the
 * address), the companion-file checkboxes that exist only for a blank page, the list of pages to
 * copy, and what Create, Enter and Cancel hand back.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import NewPage from '../NewPage';

const PAGES = [
  { file: '/etc/www/index.html', url: '/' },
  { file: '/etc/www/about.html', url: '/about' },
];

function setup(taken: string[] = ['/about']) {
  const onCancel = vi.fn();
  const onCreate = vi.fn();
  render(<NewPage taken={taken} pages={PAGES} onCancel={onCancel} onCreate={onCreate} />);
  const url = screen.getByPlaceholderText('/pricing, or / for the home page');
  const create = screen.getByRole('button', { name: 'Create' });
  return { onCancel, onCreate, url, create, user: userEvent.setup() };
}

describe('NewPage address note', () => {
  it('explains the empty field and keeps Create disabled', () => {
    const { create } = setup();
    expect(screen.getByText(/The address the page will be served at/)).toBeInTheDocument();
    expect(create).toBeDisabled();
  });

  it('shows the file and URL a valid address creates, with both companions by default', async () => {
    const { url, user, create } = setup();
    await user.type(url, 'pricing/');
    const note = screen.getByText(/Creates/).closest('p')!;
    expect(note).toHaveTextContent('Creates /etc/www/pricing.html, served at /pricing.');
    expect(note).toHaveTextContent('And /pricing.css / .js, linked from it.');
    expect(create).toBeEnabled();
  });

  it('shows the home page file for a bare slash', async () => {
    const { url, user } = setup();
    await user.type(url, '/');
    expect(screen.getByText(/Creates/).closest('p')).toHaveTextContent(
      'Creates /etc/www/index.html, served at /.',
    );
  });

  it('names only the companion that is switched on', async () => {
    const { url, user } = setup();
    await user.type(url, '/p');
    await user.click(screen.getByLabelText('Create a script for it too'));
    expect(screen.getByText(/Creates/).closest('p')).toHaveTextContent('And /p.css, linked');
    await user.click(screen.getByLabelText('Create a script for it too'));
    await user.click(screen.getByLabelText('Create a stylesheet for it too'));
    expect(screen.getByText(/Creates/).closest('p')).toHaveTextContent('And /p.js, linked');
  });

  it('leaves out the companion sentence when both are switched off', async () => {
    const { url, user } = setup();
    await user.type(url, '/p');
    await user.click(screen.getByLabelText('Create a script for it too'));
    await user.click(screen.getByLabelText('Create a stylesheet for it too'));
    const note = screen.getByText(/Creates/).closest('p')!;
    expect(note).not.toHaveTextContent('linked from it');
  });

  it('says what is wrong with an address and disables Create', async () => {
    const { url, user, create } = setup();
    await user.type(url, '/pri cing');
    expect(screen.getByText('Letters, numbers, dashes and underscores only.')).toBeInTheDocument();
    expect(create).toBeDisabled();
  });

  it('refuses an address that is already taken', async () => {
    const { url, user, create } = setup();
    await user.type(url, '/about');
    expect(screen.getByText('There is already a page at /about.')).toBeInTheDocument();
    expect(create).toBeDisabled();
  });
});

describe('NewPage copying', () => {
  it('lists a blank page and a copy of each existing page', () => {
    setup();
    const options = screen.getAllByRole('option').map(option => option.textContent);
    expect(options).toEqual(['A blank page', 'A copy of /', 'A copy of /about']);
  });

  it('hides the companion checkboxes and the companion sentence for a copy', async () => {
    const { url, user } = setup();
    await user.type(url, '/new');
    await user.selectOptions(screen.getByRole('combobox'), '/etc/www/about.html');
    expect(screen.queryByLabelText('Create a stylesheet for it too')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Create a script for it too')).not.toBeInTheDocument();
    expect(screen.getByText(/Creates/).closest('p')).not.toHaveTextContent('linked from it');
  });

  it('brings the checkboxes back, as they were, on returning to a blank page', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('Create a script for it too'));
    await user.selectOptions(screen.getByRole('combobox'), '/etc/www/about.html');
    await user.selectOptions(screen.getByRole('combobox'), '');
    expect(screen.getByLabelText('Create a stylesheet for it too')).toBeChecked();
    expect(screen.getByLabelText('Create a script for it too')).not.toBeChecked();
  });
});

describe('NewPage creating', () => {
  it('hands back the file, no source page and both companions for a default blank page', async () => {
    const { url, user, create, onCreate } = setup();
    await user.type(url, '/pricing');
    await user.click(create);
    expect(onCreate).toHaveBeenCalledWith('/etc/www/pricing.html', null, { css: true, js: true });
  });

  it('hands back only the companions left on', async () => {
    const { url, user, create, onCreate } = setup();
    await user.type(url, '/pricing');
    await user.click(screen.getByLabelText('Create a stylesheet for it too'));
    await user.click(create);
    expect(onCreate).toHaveBeenCalledWith('/etc/www/pricing.html', null, { css: false, js: true });
  });

  it('hands back the page to copy and no companions, however the boxes were left', async () => {
    const { url, user, create, onCreate } = setup();
    await user.type(url, '/pricing');
    await user.selectOptions(screen.getByRole('combobox'), '/etc/www/about.html');
    await user.click(create);
    expect(onCreate).toHaveBeenCalledWith('/etc/www/pricing.html', '/etc/www/about.html', {
      css: false,
      js: false,
    });
  });

  it('creates with Enter in the address field', async () => {
    const { url, user, onCreate } = setup();
    await user.type(url, '/pricing{Enter}');
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('creates nothing with Enter while the address has a problem', async () => {
    const { url, user, onCreate } = setup();
    await user.type(url, '/about{Enter}');
    expect(onCreate).not.toHaveBeenCalled();
    await user.clear(url);
    await user.keyboard('{Enter}');
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe('NewPage cancelling', () => {
  it('reports Cancel, and creates nothing', async () => {
    const { user, onCancel, onCreate } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('reports Escape as a cancel', async () => {
    const { user, onCancel } = setup();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
