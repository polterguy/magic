// @vitest-environment jsdom
/*
 * NoAccess page: says who is signed in, lists the roles the token carries (or that there are
 * none), and signs out on request.
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { fakeToken, renderPage, TEST_BACKEND } from '../../test/renderPage';
import NoAccess from '../NoAccess';

describe('NoAccess', () => {
  it('names the user and the roles the token carries', () => {
    const backend = {
      ...TEST_BACKEND,
      username: 'alice',
      token: fakeToken({ unique_name: 'alice', role: ['guest', 'dev'] }),
    };
    renderPage(<NoAccess />, { auth: { backend } });

    expect(screen.getByRole('heading', { name: 'No dashboard access' })).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('guest, dev')).toBeInTheDocument();
  });

  it('says there are no roles when the token has none', () => {
    const backend = { ...TEST_BACKEND, token: fakeToken({ unique_name: 'bob' }) };
    renderPage(<NoAccess />, { auth: { backend } });

    expect(screen.getByText('no roles at all')).toBeInTheDocument();
  });

  it('signs out', async () => {
    const { auth } = renderPage(<NoAccess />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});
