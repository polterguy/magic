// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import KpiCards from '../KpiCards';
import { PublicEndpointWarningDialog } from '../WarningDialogs';

function renderCards(publicEndpoints: number | null, onPublicEndpointWarning = vi.fn()) {
  render(
    <MemoryRouter>
      <KpiCards
        version="1.0"
        endpoints={10}
        publicEndpoints={publicEndpoints}
        users={1}
        tasks={0}
        logItems={0}
        onEndpointWarning={vi.fn()}
        onPublicEndpointWarning={onPublicEndpointWarning}
      />
    </MemoryRouter>,
  );
  return onPublicEndpointWarning;
}

const warnButton = () =>
  screen.queryByTitle('Public endpoints require no authentication — click for details');

describe('Public endpoints card', () => {
  it('offers the warning from a single public endpoint', async () => {
    const onWarning = renderCards(1);
    await userEvent.click(warnButton()!);
    expect(onWarning).toHaveBeenCalledTimes(1);
  });

  it('offers it for several', () => {
    renderCards(3);
    expect(warnButton()).toBeInTheDocument();
  });

  it.each([0, null])('has no warning button for %s', count => {
    renderCards(count);
    expect(warnButton()).not.toBeInTheDocument();
  });
});

describe('PublicEndpointWarningDialog', () => {
  it('speaks of one endpoint in the singular', () => {
    render(<PublicEndpointWarningDialog publicEndpoints={1} onClose={vi.fn()} />);
    expect(screen.getByRole('heading')).toHaveTextContent('This cloudlet has a public endpoint');
    expect(screen.getByText(/has 1 endpoint that requires/)).toBeInTheDocument();
  });

  it('speaks of several in the plural', () => {
    render(<PublicEndpointWarningDialog publicEndpoints={4} onClose={vi.fn()} />);
    expect(screen.getByRole('heading')).toHaveTextContent('This cloudlet has public endpoints');
    expect(screen.getByText(/has 4 endpoints that require/)).toBeInTheDocument();
  });
});
