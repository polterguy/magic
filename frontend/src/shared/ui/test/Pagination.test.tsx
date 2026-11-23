// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Pagination from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when everything fits on one page', () => {
    const { container } = render(<Pagination page={0} pageCount={1} onPage={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the 1-based page number and the page count', () => {
    render(<Pagination page={1} pageCount={4} onPage={vi.fn()} />);
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('disables Prev on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination page={0} pageCount={3} onPage={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Prev/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
    rerender(<Pagination page={2} pageCount={3} onPage={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Prev/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });

  it('asks for the neighbouring pages', async () => {
    const onPage = vi.fn();
    render(<Pagination page={1} pageCount={3} onPage={onPage} />);
    await userEvent.click(screen.getByRole('button', { name: /Prev/ }));
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onPage.mock.calls).toEqual([[0], [2]]);
  });
});
