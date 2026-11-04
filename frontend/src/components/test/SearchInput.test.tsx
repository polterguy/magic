// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SearchInput from '../SearchInput';

function Controlled(props: Readonly<{ onChange: (value: string) => void }>) {
  const [value, setValue] = useState('');
  return (
    <SearchInput
      value={value}
      placeholder="Filter"
      onChange={next => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

describe('SearchInput', () => {
  it('has no clear button while empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.queryByTitle('Clear search')).not.toBeInTheDocument();
  });

  it('reports what is typed', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('Filter'), 'ab');
    expect(onChange).toHaveBeenLastCalledWith('ab');
  });

  it('clears the value with the clear button, which then disappears', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('Filter'), 'x');
    await userEvent.click(screen.getByTitle('Clear search'));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByPlaceholderText('Filter')).toHaveValue('');
    expect(screen.queryByTitle('Clear search')).not.toBeInTheDocument();
  });
});
