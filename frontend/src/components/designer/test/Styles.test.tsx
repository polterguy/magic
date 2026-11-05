// @vitest-environment jsdom
/*
 * Styles panel: the empty state, the target menu (this element vs. a page rule) and the
 * notes that go with it, committing typed values on blur / Enter with CSS validation,
 * menus and colour pickers applying at once, clearing, the draft being dropped when the
 * selection moves, and listing / editing / removing the page's rules.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Overrides } from '../css';
import Styles, { INLINE } from '../Styles';

type Props = React.ComponentProps<typeof Styles>;

function makeElement(style = '', tag = 'div') {
  const element = document.createElement(tag);
  if (style) element.setAttribute('style', style);
  document.body.append(element);
  return element;
}

function renderStyles(overrides: Partial<Props> = {}) {
  const callbacks = {
    onTarget: vi.fn(),
    onSet: vi.fn(),
    onEditRule: vi.fn(),
    onRemoveRule: vi.fn(),
  };
  const props: Props = {
    element: makeElement('padding: 4px'),
    frameWindow: globalThis.window,
    selectors: ['.card', '#hero'],
    target: INLINE,
    overrides: {},
    stylesheet: '/etc/www/site.css',
    onText: false,
    missing: [],
    ...callbacks,
    ...overrides,
  };
  const view = render(<Styles {...props} />);
  return { ...callbacks, props, view };
}

const field = (label: string) =>
  screen.getByText(label, { selector: 'label' }).closest('.designer-style') as HTMLElement;

describe('Styles panel', () => {
  it('says nothing is selected without an element', () => {
    renderStyles({ element: null });
    expect(screen.getByText('Nothing selected.')).toBeInTheDocument();
  });

  it('shows the property groups, with the inline value filled in', () => {
    renderStyles();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Spacing & size')).toBeInTheDocument();
    expect(within(field('Padding')).getByRole('textbox')).toHaveValue('4px');
    expect(within(field('Margin')).getByRole('textbox')).toHaveValue('');
  });

  it('offers the page selectors as targets and reports a change of target', async () => {
    const { onTarget } = renderStyles();
    const menu = screen.getByLabelText('Change');
    expect(within(menu).getByRole('option', { name: 'This element only' })).toBeInTheDocument();
    expect(
      within(menu).getByRole('option', { name: 'Everything matching .card' }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(menu, '#hero');
    expect(onTarget).toHaveBeenCalledWith('#hero');
  });

  it('explains where the change is saved for each target', () => {
    const { view, props } = renderStyles();
    expect(screen.getByText(/Saved as a style attribute/)).toBeInTheDocument();
    view.rerender(<Styles {...props} target=".card" />);
    expect(screen.getByText('/etc/www/site.css')).toBeInTheDocument();
  });

  it('explains when the page has no stylesheet, or its stylesheet is missing', () => {
    const { view, props } = renderStyles({ stylesheet: null });
    expect(screen.getByText(/links no stylesheet of its own/)).toBeInTheDocument();
    view.rerender(<Styles {...props} missing={['a.css', 'b.css']} />);
    expect(screen.getByText(/a\.css and b\.css/)).toBeInTheDocument();
    expect(screen.queryByText(/links no stylesheet/)).not.toBeInTheDocument();
  });

  it('notes that text styles belong to the parent element', () => {
    renderStyles({ onText: true });
    expect(screen.getByText(/A run of text has no styles of its own/)).toBeInTheDocument();
  });

  it('adds the widget group for a toolbox widget', () => {
    const element = makeElement('', 'magic-data-grid');
    renderStyles({ element });
    expect(screen.getByText('Data grid')).toBeInTheDocument();
  });
});

describe('Styles editing', () => {
  it('commits a typed value on blur, trimmed, and not before', async () => {
    const { onSet } = renderStyles();
    const input = within(field('Margin')).getByRole('textbox');
    await userEvent.type(input, ' 8px ');
    expect(onSet).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(onSet).toHaveBeenCalledWith('margin', '8px');
  });

  it('commits on Enter', async () => {
    const { onSet } = renderStyles();
    await userEvent.type(within(field('Margin')).getByRole('textbox'), '2em{Enter}');
    expect(onSet).toHaveBeenCalledWith('margin', '2em');
  });

  it('marks a value CSS rejects and does not apply it', async () => {
    const { onSet } = renderStyles();
    const input = within(field('Width')).getByRole('textbox');
    await userEvent.type(input, 'banana{Enter}');
    expect(onSet).not.toHaveBeenCalled();
    expect(input).toHaveClass('invalid');
    expect(input).toHaveValue('banana');
    // Typing again lifts the mark.
    await userEvent.type(input, 'x');
    expect(input).not.toHaveClass('invalid');
    // Committing the same bad value twice keeps it marked.
    await userEvent.keyboard('{Enter}{Enter}');
    expect(input).toHaveClass('invalid');
    // Fixing it applies.
    await userEvent.clear(input);
    await userEvent.type(input, '50%{Enter}');
    expect(onSet).toHaveBeenCalledWith('width', '50%');
  });

  it('commits an emptied field as a clear', async () => {
    const { onSet } = renderStyles();
    const input = within(field('Padding')).getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.keyboard('{Enter}');
    expect(onSet).toHaveBeenCalledWith('padding', '');
  });

  it('ignores a blur on a field that was never typed in', async () => {
    const { onSet } = renderStyles();
    const input = within(field('Margin')).getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab();
    expect(onSet).not.toHaveBeenCalled();
  });

  it('applies a menu choice at once', async () => {
    const { onSet } = renderStyles();
    await userEvent.selectOptions(within(field('Display')).getByRole('combobox'), 'flex');
    expect(onSet).toHaveBeenCalledWith('display', 'flex');
  });

  it('applies a colour from the picker at once', () => {
    const { onSet } = renderStyles();
    const picker = within(field('Colour')).getByDisplayValue('#000000');
    fireEvent.change(picker, { target: { value: '#ff0000' } });
    expect(onSet).toHaveBeenCalledWith('color', '#ff0000');
  });

  it('shows a clear button only for set values, and clearing reports an empty value', async () => {
    const { onSet } = renderStyles();
    expect(within(field('Margin')).queryByTitle('Clear margin')).not.toBeInTheDocument();
    await userEvent.click(within(field('Padding')).getByTitle('Clear padding'));
    expect(onSet).toHaveBeenCalledWith('padding', '');
  });

  it('shows the value of the page rule when a rule is the target', () => {
    renderStyles({ target: '.card', overrides: { '.card': { margin: '10px' } } });
    expect(within(field('Margin')).getByRole('textbox')).toHaveValue('10px');
    expect(within(field('Padding')).getByRole('textbox')).toHaveValue('');
  });

  it('drops an uncommitted draft when the selection moves to another element', async () => {
    const { view, props } = renderStyles();
    await userEvent.type(within(field('Margin')).getByRole('textbox'), '9px');
    view.rerender(<Styles {...props} element={makeElement()} />);
    expect(within(field('Margin')).getByRole('textbox')).toHaveValue('');
  });
});

describe('Styles rules list', () => {
  const overrides: Overrides = {
    '.card': { margin: '1px', padding: '2px' },
    '#hero': { color: 'red' },
    '.empty': {},
  };

  it('lists rules with properties, with their counts, skipping empty ones', () => {
    renderStyles({ overrides });
    expect(screen.getByText('Rules on this page')).toBeInTheDocument();
    expect(screen.getByText('.card').closest('button')).toHaveTextContent('2');
    expect(screen.getByText('#hero').closest('button')).toHaveTextContent('1');
    expect(screen.queryByText('.empty')).not.toBeInTheDocument();
  });

  it('opens and removes a rule, and marks the current one', async () => {
    const { onEditRule, onRemoveRule } = renderStyles({ overrides, target: '.card' });
    expect(screen.getByText('.card').closest('button')).toHaveClass('current');
    await userEvent.click(screen.getByText('#hero'));
    expect(onEditRule).toHaveBeenCalledWith('#hero');
    await userEvent.click(screen.getByTitle('Remove the whole #hero rule'));
    expect(onRemoveRule).toHaveBeenCalledWith('#hero');
  });

  it('hides the list when no rule has properties', () => {
    renderStyles({ overrides: { '.empty': {} } });
    expect(screen.queryByText('Rules on this page')).not.toBeInTheDocument();
  });
});
