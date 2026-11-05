// @vitest-environment jsdom
/*
 * Media picker: listing files under the web root filtered by kind, grouping by folder,
 * the name filter and its empty states, marking the current file, picking (with measured
 * size for images and videos, never for audio), the upload flow and its folder choice,
 * and error handling.
 */
import { createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { DialogProvider } from '../../Dialogs';
import Media from '../Media';
import type { MediaKind } from '../mediaKinds';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  listFilesRecursively: vi.fn(),
  uploadFile: vi.fn(),
}));

const FILES = [
  '/etc/www/logo.png',
  '/etc/www/img/team/bob.JPG',
  '/etc/www/img/hero.webp',
  '/etc/www/notes.txt',
  '/etc/www/media/clip.mp4',
  '/etc/www/media/song.mp3',
];

afterEach(() => {
  vi.clearAllMocks();
});

function renderMedia(kind: MediaKind = 'image', current = '', files: string[] = FILES) {
  vi.mocked(api.listFilesRecursively).mockResolvedValue(files);
  const onPick = vi.fn();
  const onCancel = vi.fn();
  render(
    <DialogProvider>
      <Media
        kind={kind}
        origin="https://cloud.test"
        current={current}
        onPick={onPick}
        onCancel={onCancel}
      />
    </DialogProvider>,
  );
  return { onPick, onCancel };
}

describe('Media listing', () => {
  it('lists only the files of the kind, grouped by folder', async () => {
    renderMedia();
    expect(screen.getByText('Choose an image')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(await screen.findByTitle('/logo.png')).toBeInTheDocument();
    expect(screen.getByTitle('/img/team/bob.JPG')).toBeInTheDocument();
    expect(screen.getByTitle('/img/hero.webp')).toBeInTheDocument();
    expect(screen.queryByTitle('/notes.txt')).not.toBeInTheDocument();
    expect(screen.queryByTitle('/media/clip.mp4')).not.toBeInTheDocument();
    expect(api.listFilesRecursively).toHaveBeenCalledWith('/etc/www/', false);
    const folders = Array.from(document.querySelectorAll('.designer-images-folder')).map(
      el => el.textContent,
    );
    expect(folders).toEqual(['/', '/img', '/img/team']);
    expect(screen.getByText('3 files')).toBeInTheDocument();
  });

  it('previews images from the cloudlet origin', async () => {
    renderMedia();
    await screen.findByTitle('/logo.png');
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://cloud.test/logo.png');
  });

  it('marks the current file', async () => {
    renderMedia('image', '/img/hero.webp');
    expect(await screen.findByTitle('/img/hero.webp')).toHaveClass('current');
    expect(screen.getByTitle('/logo.png')).not.toHaveClass('current');
  });

  it('filters by name or folder and says when nothing matches', async () => {
    renderMedia();
    await screen.findByTitle('/logo.png');
    await userEvent.type(screen.getByPlaceholderText('Filter by name or folder…'), 'TEAM');
    expect(screen.queryByTitle('/logo.png')).not.toBeInTheDocument();
    expect(screen.getByTitle('/img/team/bob.JPG')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Filter by name or folder…'), 'zzz');
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it('says so when there are no files of the kind', async () => {
    renderMedia('image', '', ['/etc/www/notes.txt']);
    expect(await screen.findByText(/There is no image under/)).toBeInTheDocument();
  });

  it('shows the error when listing fails', async () => {
    vi.mocked(api.listFilesRecursively).mockRejectedValue(new Error('forbidden'));
    render(
      <DialogProvider>
        <Media kind="image" origin="" current="" onPick={vi.fn()} onCancel={vi.fn()} />
      </DialogProvider>,
    );
    expect(await screen.findByText('forbidden')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  it('lists videos and audio under their own titles', async () => {
    renderMedia('video');
    expect(await screen.findByTitle('/media/clip.mp4')).toBeInTheDocument();
    expect(screen.getByText('Choose a video')).toBeInTheDocument();
    expect(screen.queryByTitle('/media/song.mp3')).not.toBeInTheDocument();
  });

  it('renders audio tiles without a media element', async () => {
    renderMedia('audio');
    expect(await screen.findByTitle('/media/song.mp3')).toBeInTheDocument();
    expect(screen.getByText('Choose an audio file')).toBeInTheDocument();
    expect(document.querySelector('.designer-media-audio')).not.toBeNull();
    expect(document.querySelector('audio, video, img')).toBeNull();
  });
});

describe('Media picking', () => {
  it('picks a file, with its measured size once the preview has loaded', async () => {
    const { onPick } = renderMedia();
    const tile = await screen.findByTitle('/logo.png');
    const img = tile.querySelector('img') as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { value: 320 });
    Object.defineProperty(img, 'naturalHeight', { value: 200 });
    fireEvent.load(img);
    expect(within(tile).getByText('320 × 200')).toBeInTheDocument();
    await userEvent.click(tile);
    expect(onPick).toHaveBeenCalledWith({ src: '/logo.png', width: 320, height: 200 });
  });

  it('picks with zero size when the preview has not been measured', async () => {
    const { onPick } = renderMedia();
    await userEvent.click(await screen.findByTitle('/logo.png'));
    expect(onPick).toHaveBeenCalledWith({ src: '/logo.png', width: 0, height: 0 });
  });

  it('measures videos from their metadata', async () => {
    const { onPick } = renderMedia('video');
    const tile = await screen.findByTitle('/media/clip.mp4');
    const video = tile.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'videoWidth', { value: 1280 });
    Object.defineProperty(video, 'videoHeight', { value: 720 });
    video.dispatchEvent(createEvent.loadedMetadata(video));
    await waitFor(() => expect(within(tile).getByText('1280 × 720')).toBeInTheDocument());
    await userEvent.click(tile);
    expect(onPick).toHaveBeenCalledWith({ src: '/media/clip.mp4', width: 1280, height: 720 });
  });

  it('never attaches a size to audio', async () => {
    const { onPick } = renderMedia('audio');
    await userEvent.click(await screen.findByTitle('/media/song.mp3'));
    expect(onPick).toHaveBeenCalledWith({ src: '/media/song.mp3', width: 0, height: 0 });
  });

  it('cancels', async () => {
    const { onCancel } = renderMedia();
    await screen.findByTitle('/logo.png');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

// The picker's file input has accept="image/*", which userEvent honours.
const png = (name: string) => new File(['x'], name, { type: 'image/png' });

describe('Media upload', () => {
  const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

  it('defaults the destination to the current file folder and offers folders holding the kind', async () => {
    renderMedia('image', '/img/team/bob.JPG');
    await screen.findByTitle('/logo.png');
    const select = screen.getByTitle('Where an upload goes');
    expect(select).toHaveValue('/img/team');
    expect(Array.from(select.querySelectorAll('option')).map(o => o.textContent)).toEqual([
      '/',
      '/img',
      '/img/team',
    ]);
  });

  it('defaults to the web root for a remote or inlined source', async () => {
    renderMedia('image', 'https://elsewhere.test/a.png');
    await screen.findByTitle('/logo.png');
    expect(screen.getByTitle('Where an upload goes')).toHaveValue('');
  });

  it('uploads into the chosen folder, re-lists and narrows to the new file', async () => {
    vi.mocked(api.uploadFile).mockResolvedValue(undefined as never);
    renderMedia();
    await screen.findByTitle('/logo.png');
    await userEvent.selectOptions(screen.getByTitle('Where an upload goes'), '/img');
    const upload = png('new.png');
    await userEvent.upload(fileInput(), upload);
    await waitFor(() => expect(api.uploadFile).toHaveBeenCalledWith('/etc/www/img/', upload));
    await waitFor(() => expect(api.listFilesRecursively).toHaveBeenCalledTimes(2));
    expect(screen.getByPlaceholderText('Filter by name or folder…')).toHaveValue('new.png');
  });

  it('clears the filter after a multi-file upload', async () => {
    vi.mocked(api.uploadFile).mockResolvedValue(undefined as never);
    renderMedia();
    await screen.findByTitle('/logo.png');
    await userEvent.upload(fileInput(), [png('a.png'), png('b.png')]);
    await waitFor(() => expect(api.uploadFile).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(api.listFilesRecursively).toHaveBeenCalledTimes(2));
    expect(screen.getByPlaceholderText('Filter by name or folder…')).toHaveValue('');
  });

  it('shows the error from a failed upload and re-enables the controls', async () => {
    vi.mocked(api.uploadFile).mockRejectedValue(new Error('disk full'));
    renderMedia();
    await screen.findByTitle('/logo.png');
    await userEvent.upload(fileInput(), png('a.png'));
    expect(await screen.findByText('disk full')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload…' })).toBeEnabled();
  });

  it('opens the file chooser from the Upload button', async () => {
    renderMedia();
    await screen.findByTitle('/logo.png');
    const click = vi.spyOn(fileInput(), 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Upload…' }));
    expect(click).toHaveBeenCalled();
  });
});
