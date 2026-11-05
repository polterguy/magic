// @vitest-environment jsdom
/*
 * The Meta panel: the head values it reads out of the open page, the edits it reports, the
 * server-filled values it locks until "Edit anyway" is pressed, the two image fields that open
 * the media chooser, and the suggestion lists attached to the text fields.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SERVER_FILLED } from '../html';
import Meta from '../Meta';

const HEAD =
  '<title>My page</title>' +
  '<meta name="description" content="About things">' +
  '<link rel="canonical" href="https://example.com/a">' +
  '<meta name="viewport" content="width=1024">' +
  '<meta property="og:title" content="Shared title">' +
  '<meta property="og:image" content="https://example.com/i.png">';

function page(head = HEAD, lang = 'en') {
  return new DOMParser().parseFromString(
    '<!doctype html><html lang="' + lang + '"><head>' + head + '</head><body></body></html>',
    'text/html',
  );
}

function setup(doc: Document | null = page(), urls = ['/', '/about']) {
  const onSet = vi.fn();
  const onChooseImage = vi.fn();
  const view = render(
    <Meta
      doc={doc}
      origin="https://example.com"
      urls={urls}
      onSet={onSet}
      onChooseImage={onChooseImage}
    />,
  );
  // 0 Title, 1 Description, 2 Canonical, 3 Language, 4 Viewport, then Sharing: 5 Title,
  // 6 Description, 7 Image, 8 Address, 9 Type, 10 Card, 11 Card image.
  const fields = () => Array.from(view.container.querySelectorAll<HTMLElement>('.designer-field'));
  const control = (index: number) =>
    fields()[index].querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')!;
  return { ...view, onSet, onChooseImage, fields, control };
}

describe('Meta without a page', () => {
  it('says so when no page is open', () => {
    setup(null);
    expect(screen.getByText('No page open.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('Meta reading the head', () => {
  it('shows the values the open page carries, and an empty box for the rest', () => {
    const { fields, control } = setup();
    expect(fields()).toHaveLength(12);
    expect(control(0)).toHaveValue('My page');
    expect(control(1)).toHaveValue('About things');
    expect(control(2)).toHaveValue('https://example.com/a');
    expect(control(3)).toHaveValue('en');
    expect(control(4)).toHaveValue('width=1024');
    expect(control(5)).toHaveValue('Shared title');
    expect(control(6)).toHaveValue('');
    expect(control(7)).toHaveValue('https://example.com/i.png');
    expect(control(8)).toHaveValue('');
    expect(control(10)).toHaveValue('');
    expect(control(0)).toHaveAttribute('placeholder', 'None');
  });

  it('titles the two groups and explains the sharing one', () => {
    setup();
    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByText('Sharing')).toBeInTheDocument();
    expect(screen.getByText(/What a link to this page looks like/)).toBeInTheDocument();
  });

  it('shows a hint under the fields that have one', () => {
    setup();
    expect(screen.getByText(/Shown in the browser tab/)).toBeInTheDocument();
    expect(screen.getByText(/Wide and at least 1200 pixels/)).toBeInTheDocument();
  });

  it('renders the description fields as textareas and the rest as text inputs', () => {
    const { control } = setup();
    expect(control(1).tagName).toBe('TEXTAREA');
    expect(control(6).tagName).toBe('TEXTAREA');
    expect(control(0).tagName).toBe('INPUT');
  });
});

describe('Meta reporting edits', () => {
  it('reports a changed text field with where the value lives', () => {
    const { control, onSet } = setup();
    fireEvent.change(control(0), { target: { value: 'New title' } });
    expect(onSet).toHaveBeenCalledWith({ at: 'title' }, 'New title');
    fireEvent.change(control(4), { target: { value: 'width=device-width' } });
    expect(onSet).toHaveBeenCalledWith({ at: 'name', key: 'viewport' }, 'width=device-width');
    fireEvent.change(control(9), { target: { value: 'article' } });
    expect(onSet).toHaveBeenCalledWith({ at: 'property', key: 'og:type' }, 'article');
  });

  it('reports a changed textarea', () => {
    const { control, onSet } = setup();
    fireEvent.change(control(1), { target: { value: 'Different' } });
    expect(onSet).toHaveBeenCalledWith({ at: 'name', key: 'description' }, 'Different');
  });

  it('reports the language edit against the language home', () => {
    const { control, onSet } = setup();
    fireEvent.change(control(3), { target: { value: 'nb' } });
    expect(onSet).toHaveBeenCalledWith({ at: 'lang' }, 'nb');
  });
});

describe('Meta server-filled values', () => {
  const FILLED = HEAD.replace('https://example.com/a', '{{page.url}}')
    .replace('About things', '{{page.description}}')
    .replace('Shared title', '{{page.title}}');

  it('locks a value that holds a server expression and says why', () => {
    const { control } = setup(page(FILLED));
    expect(control(1)).toHaveAttribute('readonly');
    expect(control(2)).toHaveAttribute('readonly');
    expect(control(5)).toHaveAttribute('readonly');
    expect(control(0)).not.toHaveAttribute('readonly');
    expect(screen.getAllByText(SERVER_FILLED, { exact: false })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Edit anyway' })).toHaveLength(3);
  });

  it('marks a filled field so it can be styled', () => {
    const { fields } = setup(page(FILLED));
    expect(fields()[2]).toHaveClass('designer-server-filled');
    expect(fields()[0]).not.toHaveClass('designer-server-filled');
  });

  it('unlocks only the one field whose button was pressed', async () => {
    const user = userEvent.setup();
    const { control, fields } = setup(page(FILLED));
    await user.click(fields()[2].querySelector('button')!);
    expect(control(2)).not.toHaveAttribute('readonly');
    expect(control(1)).toHaveAttribute('readonly');
    // The warning stays, the button that unlocked it does not.
    expect(fields()[2].querySelector('button')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Edit anyway' })).toHaveLength(2);
  });

  it('can unlock and then edit a filled textarea', async () => {
    const user = userEvent.setup();
    const { control, fields, onSet } = setup(page(FILLED));
    await user.click(fields()[1].querySelector('button')!);
    fireEvent.change(control(1), { target: { value: 'Fixed text' } });
    expect(onSet).toHaveBeenCalledWith({ at: 'name', key: 'description' }, 'Fixed text');
  });
});

describe('Meta image fields', () => {
  it('shows a preview of the chosen image and its address', () => {
    const { fields } = setup();
    const preview = fields()[7].querySelector('.designer-image-preview')!;
    expect(preview.querySelector('img')).toHaveAttribute('src', 'https://example.com/i.png');
    expect(preview).not.toHaveTextContent('Nothing chosen');
  });

  it('says nothing is chosen when the image is empty', () => {
    const { fields } = setup();
    const preview = fields()[11].querySelector('.designer-image-preview')!;
    expect(preview).toHaveTextContent('Nothing chosen');
    expect(preview.querySelector('img')).toBeNull();
  });

  it('opens the chooser for the right field from the preview and from the button', async () => {
    const user = userEvent.setup();
    const { fields, onChooseImage } = setup();
    await user.click(fields()[7].querySelector('.designer-image-preview')!);
    expect(onChooseImage).toHaveBeenLastCalledWith({ at: 'property', key: 'og:image' });
    const buttons = screen.getAllByRole('button', { name: 'Choose image…' });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);
    expect(onChooseImage).toHaveBeenLastCalledWith({ at: 'name', key: 'twitter:image' });
    expect(onChooseImage).toHaveBeenCalledTimes(2);
  });

  it('reports a typed image address', () => {
    const { control, onSet } = setup();
    fireEvent.change(control(11), { target: { value: 'https://example.com/card.png' } });
    expect(onSet).toHaveBeenCalledWith(
      { at: 'name', key: 'twitter:image' },
      'https://example.com/card.png',
    );
  });
});

describe('Meta suggestion lists', () => {
  it('offers this site’s own pages as absolute addresses', () => {
    const { container } = setup();
    const options = Array.from(container.querySelectorAll('#designer-page-urls option'), option =>
      option.getAttribute('value'),
    );
    expect(options).toEqual(['https://example.com/', 'https://example.com/about']);
  });

  it('attaches the page list to the address fields and the option list to the others', () => {
    const { control, container } = setup();
    expect(control(2)).toHaveAttribute('list', 'designer-page-urls');
    expect(control(8)).toHaveAttribute('list', 'designer-page-urls');
    expect(control(3)).toHaveAttribute('list', 'meta-3-options');
    const languages = Array.from(container.querySelectorAll('#meta-3-options option'), option =>
      option.getAttribute('value'),
    );
    expect(languages).toContain('en-GB');
    expect(container.querySelectorAll('#meta-4-options option')).toHaveLength(3);
    expect(container.querySelectorAll('#meta-105-options option')).toHaveLength(2);
  });

  it('gives a plain text field no list at all', () => {
    const { control, container } = setup();
    expect(control(0)).not.toHaveAttribute('list');
    expect(control(5)).not.toHaveAttribute('list');
    expect(container.querySelector('#meta-0-options')).toBeNull();
  });

  it('keeps an empty page list when the site has no pages', () => {
    const { container } = setup(page(), []);
    expect(container.querySelectorAll('#designer-page-urls option')).toHaveLength(0);
  });
});
