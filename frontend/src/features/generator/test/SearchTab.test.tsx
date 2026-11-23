// @vitest-environment jsdom
/*
 * SearchTab: the options card says what is still missing until the endpoint can be generated,
 * then sums it up, flags a search that spends an embedding per call, and points to Machine
 * Learning when there are no types to search.
 */
import * as api from '@core/api';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withStandInFeatures } from '../../../test/features';
import SearchTab from '../components/SearchTab';

// It links to these features; stand-ins keep the test valid in a build without them.
withStandInFeatures([{ id: 'ml', path: '/machine-learning' }]);

vi.mock('@core/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.mlTypes).mockResolvedValue([
    { type: 'docs', retrieval: 'bm25' },
    { type: 'faq', retrieval: 'embeddings' },
  ] as never);
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }] as never);
});

const renderTab = () =>
  render(
    <MemoryRouter>
      <SearchTab />
    </MemoryRouter>,
  );

describe('SearchTab', () => {
  it('says what is missing, and only enables Generate once nothing is', async () => {
    renderTab();
    const generate = screen.getByRole('button', { name: /Generate endpoint/ });
    expect(screen.getByText('Choose a module name to generate the endpoint.')).toBeInTheDocument();
    expect(generate).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Module'), 'kb');
    expect(screen.getByText('Choose a type to generate the endpoint.')).toBeInTheDocument();

    await chooseType('faq');
    expect(generate).toBeEnabled();
    expect(screen.getByText('GET /magic/modules/kb/search')).toBeInTheDocument();
    expect(screen.getByText(/by meaning, returning up to 5\./)).toBeInTheDocument();
  });

  it('flags a search by meaning as spending an embedding per call, and keyword as free', async () => {
    renderTab();
    await chooseType('faq');
    expect(screen.getByText('One OpenAI embedding per call')).toBeInTheDocument();
    await chooseType('docs');
    expect(screen.getByText('Free per call')).toBeInTheDocument();
  });

  it('points to Machine Learning when there are no types', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue([] as never);
    renderTab();
    expect(
      await screen.findByRole('link', { name: 'Create one in Machine Learning' }),
    ).toHaveAttribute('href', '/machine-learning');
  });
});

async function chooseType(name: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Type' }));
  await userEvent.click(await screen.findByRole('option', { name }));
}
