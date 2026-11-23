// @vitest-environment jsdom
import { type FeatureManifest, features, registerFeatures } from '@core/features';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import FeatureLink from '../FeatureLink';

let real: readonly FeatureManifest[] = [];
beforeAll(() => {
  real = features();
  registerFeatures([{ id: 'log', path: '/log' }]);
});
afterAll(() => registerFeatures([...real]));

function renderIn(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FeatureLink', () => {
  it('links into a feature that is part of the build', async () => {
    const onClick = vi.fn();
    renderIn(
      <FeatureLink feature="log" suffix="?id=3" className="btn" onClick={onClick}>
        View log
      </FeatureLink>,
    );
    const link = screen.getByRole('link', { name: 'View log' });
    expect(link).toHaveAttribute('href', '/log?id=3');
    expect(link).toHaveClass('btn');
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for a missing feature, or its fallback', () => {
    const { container } = renderIn(<FeatureLink feature="sql">Open SQL</FeatureLink>);
    expect(container).toBeEmptyDOMElement();
    renderIn(
      <FeatureLink feature="sql" fallback="SQL Studio">
        Open SQL
      </FeatureLink>,
    );
    expect(screen.getByText('SQL Studio')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
