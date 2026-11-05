// @vitest-environment jsdom
/*
 * Endpoints page: groups the endpoints by module, hides system modules and filters on request,
 * expands a module, and honours the ?filter= deep link and the OpenAPI button.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Endpoints from '../Endpoints';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listEndpoints).mockResolvedValue([
    { path: 'magic/modules/shop/products', verb: 'get', auth: ['root'] },
    { path: 'magic/modules/shop/products', verb: 'post', auth: ['root'] },
    { path: 'magic/modules/blog/posts', verb: 'get', auth: [] },
    { path: 'magic/system/auth/authenticate', verb: 'get', auth: [] },
  ]);
  vi.mocked(api.getOpenApiSpec).mockResolvedValue({ openapi: '3.0.0' });
});

describe('Endpoints', () => {
  it('groups user modules and hides system modules by default', async () => {
    renderPage(<Endpoints />);

    expect(await screen.findByText('shop')).toBeInTheDocument();
    expect(screen.getByText('blog')).toBeInTheDocument();
    expect(screen.queryByText('auth')).not.toBeInTheDocument();
    expect(screen.getByText('3 of 4 endpoints · 2 modules')).toBeInTheDocument();
    expect(screen.getByText('2 endpoints')).toBeInTheDocument();
  });

  it('shows system modules on request', async () => {
    renderPage(<Endpoints />);
    await screen.findByText('shop');

    await userEvent.click(screen.getByLabelText('Show system endpoints'));

    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('keeps only public endpoints when asked', async () => {
    renderPage(<Endpoints />);
    await screen.findByText('shop');

    await userEvent.click(screen.getByLabelText('Public only'));

    expect(screen.queryByText('shop')).not.toBeInTheDocument();
    expect(screen.getByText('blog')).toBeInTheDocument();
  });

  it('expands a module to list its endpoints', async () => {
    renderPage(<Endpoints />);
    const header = (await screen.findByText('shop')).closest('[role="button"]') as HTMLElement;

    await userEvent.click(header);

    expect(screen.getAllByText('magic/modules/shop/products').length).toBeGreaterThan(0);
  });

  it('filters by the typed text and opens matches', async () => {
    renderPage(<Endpoints />);
    await screen.findByText('shop');

    await userEvent.type(screen.getByPlaceholderText('Filter endpoints…'), 'posts');

    expect(screen.queryByText('shop')).not.toBeInTheDocument();
    expect(screen.getByText('magic/modules/blog/posts')).toBeInTheDocument();
  });

  it('applies the ?filter= deep link', async () => {
    renderPage(<Endpoints />, { route: '/endpoints?filter=blog' });

    expect(await screen.findByText('blog')).toBeInTheDocument();
    expect(screen.queryByText('shop')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter endpoints…')).toHaveValue('blog');
  });

  it('fetches the OpenAPI specification of a module', async () => {
    renderPage(<Endpoints />);
    const card = (await screen.findByText('shop')).closest('.card') as HTMLElement;

    await userEvent.click(within(card).getByTitle('OpenAPI specification for /modules/shop/'));

    await waitFor(() => expect(api.getOpenApiSpec).toHaveBeenCalledWith('/modules/shop/'));
    expect(await screen.findByLabelText(/code editor/)).toHaveValue(
      JSON.stringify({ openapi: '3.0.0' }, null, 2),
    );
  });
});
