// @vitest-environment jsdom
/*
 * NotFound page: explains the route is missing and links back to the dashboard.
 */
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderPage } from '../../test/renderPage';
import NotFound from '../NotFound';

describe('NotFound', () => {
  it('says nothing is here and links home', () => {
    renderPage(<NotFound />, { route: '/mistyped' });

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nothing here/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
