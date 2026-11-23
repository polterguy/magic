// @vitest-environment jsdom
/*
 * Layers tree: the empty state, default expansion depth, collapsing and expanding by
 * chevron, the selected path always standing open, selection / hover / reveal callbacks
 * (mouse and keyboard), hidden-element styling, and the search that filters to matches
 * and their ancestors.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import Layers from '../Layers';

const scrollIntoView = vi.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

function makeTree() {
  const root = document.createElement('div');
  root.id = 'app';
  root.innerHTML =
    '<header class="top"><h1>Welcome home</h1></header>' +
    '<main><section class="hero"><div class="inner"><p>Deep text here</p></div></section></main>';
  document.body.append(root);
  return {
    root,
    header: root.querySelector('header') as Element,
    h1: root.querySelector('h1') as Element,
    section: root.querySelector('section') as Element,
    inner: root.querySelector('.inner') as Element,
    para: root.querySelector('p') as Element,
  };
}

function renderLayers(overrides: Partial<React.ComponentProps<typeof Layers>> = {}) {
  const tree = makeTree();
  const callbacks = { onSelect: vi.fn(), onHover: vi.fn(), onReveal: vi.fn() };
  const props: React.ComponentProps<typeof Layers> = {
    root: tree.root,
    selected: null,
    hidden: new Set(),
    ...callbacks,
    ...overrides,
  };
  const view = render(<Layers {...props} />);
  return { ...tree, ...callbacks, view, props };
}

const rowFor = (label: string) =>
  screen.getByText(label).closest('[role="treeitem"]') as HTMLElement;

describe('Layers rendering', () => {
  it('says nothing is loaded without a root', () => {
    renderLayers({ root: null });
    expect(screen.getByText('Nothing loaded yet.')).toBeInTheDocument();
  });

  it('opens the first two levels and keeps deeper ones collapsed', () => {
    renderLayers();
    expect(screen.getByRole('tree', { name: 'Page tree' })).toBeInTheDocument();
    expect(screen.getByText('div#app')).toBeInTheDocument();
    expect(screen.getByText('header.top')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    // Depth 2 rows are shown but not opened.
    expect(screen.getByText('h1')).toBeInTheDocument();
    expect(screen.getByText('section.hero')).toBeInTheDocument();
    expect(screen.queryByText('div.inner')).not.toBeInTheDocument();
    expect(rowFor('section.hero')).toHaveAttribute('aria-expanded', 'false');
    expect(rowFor('div#app')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows a Collapse chevron on an open branch', () => {
    renderLayers();
    expect(rowFor('div#app').querySelector('.designer-layer-chevron')).toHaveAttribute(
      'title',
      'Collapse',
    );
  });

  it('expands and collapses a branch with its chevron, without selecting it', async () => {
    const { onSelect } = renderLayers();
    await userEvent.click(within(rowFor('section.hero')).getByTitle('Expand'));
    expect(screen.getByText('div.inner')).toBeInTheDocument();
    await userEvent.click(within(rowFor('section.hero')).getByTitle('Collapse'));
    expect(screen.queryByText('div.inner')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('can collapse a branch that opens by default', async () => {
    renderLayers();
    await userEvent.click(within(rowFor('header.top')).getByTitle('Collapse'));
    expect(screen.queryByText('h1')).not.toBeInTheDocument();
  });

  it('opens down to a deep selection and brings its row into view', () => {
    const tree = makeTree();
    renderLayers({ root: tree.root, selected: tree.para.firstChild });
    expect(screen.getByText('div.inner')).toBeInTheDocument();
    expect(rowFor('"Deep text here"')).toHaveClass('selected');
    expect(rowFor('"Deep text here"')).toHaveClass('text');
    expect(rowFor('"Deep text here"')).toHaveAttribute('aria-selected', 'true');
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('keeps a branch on the selected path open even when the user collapses it', async () => {
    const tree = makeTree();
    renderLayers({ root: tree.root, selected: tree.para.firstChild });
    await userEvent.click(within(rowFor('section.hero')).getByTitle('Collapse'));
    expect(screen.getByText('div.inner')).toBeInTheDocument();
  });

  it('greys elements the page renders hidden', () => {
    const tree = makeTree();
    renderLayers({ root: tree.root, hidden: new Set([tree.h1]) });
    expect(rowFor('h1')).toHaveClass('invisible');
    expect(rowFor('header.top')).not.toHaveClass('invisible');
  });
});

describe('Layers interaction', () => {
  it('selects on click, reveals on double click, and reports hover', async () => {
    const { onSelect, onReveal, onHover, h1 } = renderLayers();
    await userEvent.click(rowFor('h1'));
    expect(onSelect).toHaveBeenCalledWith(h1);
    await userEvent.dblClick(rowFor('h1'));
    expect(onReveal).toHaveBeenCalledWith(h1);
    await userEvent.hover(rowFor('h1'));
    expect(onHover).toHaveBeenLastCalledWith(h1);
    await userEvent.unhover(rowFor('h1'));
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it('gives a leaf no chevron button and no aria-expanded', () => {
    const tree = makeTree();
    renderLayers({ root: tree.root, selected: tree.para.firstChild });
    const leaf = rowFor('"Deep text here"');
    expect(leaf).not.toHaveAttribute('aria-expanded');
    expect(within(leaf).queryByRole('button')).not.toBeInTheDocument();
  });

  it('selects with Enter and Space on the row itself, but not from the chevron', async () => {
    const { onSelect, header } = renderLayers();
    rowFor('header.top').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith(header);
    onSelect.mockClear();
    within(rowFor('header.top')).getByTitle('Collapse').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('Layers search', () => {
  it('shows only matches and their ancestors, all open', async () => {
    renderLayers();
    await userEvent.type(screen.getByPlaceholderText('Search the tree…'), 'DEEP');
    expect(screen.getByText('div#app')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('section.hero')).toBeInTheDocument();
    expect(screen.getByText('div.inner')).toBeInTheDocument();
    expect(screen.getByText('"Deep text here"')).toBeInTheDocument();
    expect(screen.queryByText('header.top')).not.toBeInTheDocument();
    expect(screen.queryByText('h1')).not.toBeInTheDocument();
  });

  it('matches a tag or class name as the row labels it', async () => {
    renderLayers();
    await userEvent.type(screen.getByPlaceholderText('Search the tree…'), 'hero');
    expect(screen.getByText('section.hero')).toBeInTheDocument();
    expect(screen.queryByText('header.top')).not.toBeInTheDocument();
  });

  it('says so when nothing matches, and restores the tree when cleared', async () => {
    renderLayers();
    const search = screen.getByPlaceholderText('Search the tree…');
    await userEvent.type(search, 'zzz');
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    await userEvent.clear(search);
    expect(screen.getByText('header.top')).toBeInTheDocument();
  });
});
