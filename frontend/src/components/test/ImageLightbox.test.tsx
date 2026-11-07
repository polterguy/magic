// @vitest-environment jsdom
/*
 * ImageLightbox: the image fits the screen until clicked, and Escape, the backdrop and the
 * close button dismiss it — Escape without reaching anything behind the lightbox.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ImageLightbox from '../ImageLightbox';

function renderLightbox() {
  const onClose = vi.fn();
  render(<ImageLightbox url="blob:cat" name="cat.png" detail="12 KB" onClose={onClose} />);
  return onClose;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ImageLightbox', () => {
  it('shows the image with its name and size', () => {
    renderLightbox();
    expect(screen.getByRole('img', { name: 'cat.png' })).toHaveAttribute('src', 'blob:cat');
    expect(screen.getByText('cat.png · 12 KB')).toBeInTheDocument();
  });

  it('toggles between fitting the screen and the actual size on a click', async () => {
    renderLightbox();
    const image = screen.getByRole('button', { name: 'cat.png' });
    expect(image.parentElement).not.toHaveClass('actual');
    await userEvent.click(image);
    expect(image.parentElement).toHaveClass('actual');
    await userEvent.click(image);
    expect(image.parentElement).not.toHaveClass('actual');
  });

  it('closes with the close button', async () => {
    const onClose = renderLightbox();
    await userEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape without the key reaching listeners behind it', async () => {
    const behind = vi.fn();
    globalThis.addEventListener('keydown', behind);
    const onClose = renderLightbox();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(behind).not.toHaveBeenCalled();
    globalThis.removeEventListener('keydown', behind);
  });
});
