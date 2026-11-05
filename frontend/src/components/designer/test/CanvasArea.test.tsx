// @vitest-environment jsdom
/*
 * The middle column of the Web Designer: which pane shows for each view, what each child is
 * handed, and how the one prompt bar is pointed at the file in the code view or at the selected
 * element in the design view. The panes themselves are replaced by stubs that record their props,
 * since each has its own tests.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { aiContextForFile } from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import CanvasArea from '../CanvasArea';
import { INLINE } from '../Styles';

// Whatever props each stub was last rendered with, and how many times the prompt has mounted.
const probe = vi.hoisted(() => ({
  canvas: null as Record<string, never> | null,
  code: null as Record<string, never> | null,
  live: null as Record<string, never> | null,
  ai: null as Record<string, never> | null,
  aiMounts: 0,
}));

vi.mock('../Canvas', () => ({
  default: (props: Record<string, never>) => {
    probe.canvas = props;
    return <div data-testid="canvas" />;
  },
}));
vi.mock('../CodePane', () => ({
  default: (props: Record<string, never>) => {
    probe.code = props;
    return <div data-testid="code-pane" />;
  },
}));
vi.mock('../LivePane', () => ({
  default: (props: Record<string, never>) => {
    probe.live = props;
    return <div data-testid="live-pane" />;
  },
}));
vi.mock('../../AiPrompt', () => ({
  default: function AiPromptStub(props: Record<string, never>) {
    probe.ai = props;
    useEffect(() => {
      probe.aiMounts++;
    }, []);
    return <div data-testid="ai-prompt" />;
  },
}));

type Props = Parameters<typeof CanvasArea>[0];

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  probe.canvas = probe.code = probe.live = probe.ai = null;
  probe.aiMounts = 0;
});

afterEach(() => {
  setToastListener(null);
});

function props(
  over: {
    ui?: Partial<Props['ui']>;
    documentState?: Partial<Props['documentState']>;
    codeDraft?: Partial<Props['codeDraft']>;
    stylesheet?: Partial<Props['stylesheet']>;
    styleTarget?: Element | null;
  } = {},
): Props {
  return {
    ui: {
      view: 'design',
      width: null,
      pending: null,
      setPending: vi.fn(),
      tab: 'insert',
      setCreating: vi.fn(),
      ...over.ui,
    },
    cloudlet: {
      origin: 'https://cloud.example',
      sameOrigin: true,
      liveWarned: false,
      warnedKey: 'k',
      setLiveWarned: vi.fn(),
    },
    documentState: {
      path: '/etc/www/index.html',
      srcDoc: '<p>hi</p>',
      selected: null,
      setSelected: vi.fn(),
      hovered: null,
      setHovered: vi.fn(),
      version: 3,
      revealHovered: 1,
      revealSelected: 2,
      shell: false,
      setDirty: vi.fn(),
      ...over.documentState,
    },
    codeDraft: {
      code: '<p>hi</p>',
      setCode: vi.fn(),
      codeTarget: '',
      codeEditId: 5,
      bumpCodeEditId: vi.fn(),
      ...over.codeDraft,
    },
    stylesheet: {
      sheets: ['/etc/www/a.css'],
      scripts: ['/etc/www/a.js'],
      cssPath: '/etc/www/a.css',
      target: INLINE,
      ...over.stylesheet,
    },
    styleTarget: over.styleTarget ?? null,
    mutate: vi.fn((fn: () => void) => {
      fn();
    }),
    onReady: vi.fn().mockResolvedValue(undefined),
    move: vi.fn(),
    insert: vi.fn(),
    rewriteSelected: vi.fn(),
    onKey: vi.fn(),
    switchCodeTarget: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(true),
  };
}

// What the tests call on the recorded props, on top of what toMatchObject reads.
interface CanvasProbe {
  hidden: boolean;
  inserting: boolean;
  note: string | null;
  highlight: string;
  onInsert: (spot: unknown) => void;
  onPendingDone: () => void;
  onEditText: (node: Text, text: string) => void;
}
interface AiProbe {
  fileType: string;
  session: string;
  getContext: () => string | undefined;
  getOldCode: () => string;
  onResult: (value: string) => void;
  onError: (message: string) => void;
}
const canvas = () => probe.canvas as unknown as CanvasProbe;
const ai = () => probe.ai as unknown as AiProbe;

describe('CanvasArea with no page open', () => {
  it('offers to create the first page and shows no pane', async () => {
    const p = props({ documentState: { path: '' } });
    render(<CanvasArea {...p} />);
    expect(screen.getByText('This cloudlet serves no pages yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-prompt')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Create the first one…' }));
    expect(p.ui.setCreating).toHaveBeenCalledWith(true);
  });

  it('shows no prompt bar and no panes in the code and live views either', () => {
    for (const view of ['code', 'live'] as const) {
      const { unmount } = render(
        <CanvasArea {...props({ ui: { view }, documentState: { path: '' } })} />,
      );
      expect(screen.queryByTestId('code-pane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('live-pane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-prompt')).not.toBeInTheDocument();
      unmount();
    }
  });
});

describe('CanvasArea design view', () => {
  it('shows the canvas visible, and a hint when nothing is selected', () => {
    render(<CanvasArea {...props()} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(canvas().hidden).toBe(false);
    expect(screen.queryByTestId('code-pane')).not.toBeInTheDocument();
    expect(screen.queryByTestId('live-pane')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-prompt')).not.toBeInTheDocument();
    expect(
      screen.getByText('Select something on the canvas, and the Machine will change that.'),
    ).toBeInTheDocument();
  });

  it('hands the canvas the document state', () => {
    const p = props();
    render(<CanvasArea {...p} />);
    expect(canvas()).toMatchObject({
      srcDoc: '<p>hi</p>',
      width: null,
      version: 3,
      revealHovered: 1,
      revealSelected: 2,
      inserting: false,
      note: null,
      highlight: '',
      onReady: p.onReady,
      onHover: p.documentState.setHovered,
      onSelect: p.documentState.setSelected,
      onMove: p.move,
      onKey: p.onKey,
    });
  });

  it('explains why a page that draws nothing by itself looks empty', () => {
    render(<CanvasArea {...props({ documentState: { shell: true } })} />);
    expect(canvas().note).toContain('This page draws nothing by itself');
  });

  it('points the prompt bar at the selected element', () => {
    const element = document.createElement('section');
    element.innerHTML = '<b>x</b>';
    const p = props({ styleTarget: element });
    render(<CanvasArea {...p} />);
    expect(screen.getByTestId('ai-prompt')).toBeInTheDocument();
    expect(ai().fileType).toBe('html');
    expect(ai().session).toBe('/etc/www/index.html element');
    expect(ai().getOldCode()).toBe('<section><b>x</b></section>');
    expect(ai().getContext()).toBe(
      aiContextForFile('/etc/www/index.html', '<section><b>x</b></section>'),
    );
    ai().onResult('<section>new</section>');
    expect(p.rewriteSelected).toHaveBeenCalledWith('<section>new</section>');
    ai().onError('the machine failed');
    expect(toasts).toEqual([
      expect.objectContaining({ text: 'the machine failed', isError: true }),
    ]);
    expect(
      screen.queryByText('Select something on the canvas, and the Machine will change that.'),
    ).not.toBeInTheDocument();
  });
});

describe('CanvasArea canvas callbacks', () => {
  it('marks the canvas as inserting while a block is pending, and inserts it at the spot', () => {
    const block = { id: 'b' } as never;
    const p = props({ ui: { pending: block } });
    render(<CanvasArea {...p} />);
    expect(canvas().inserting).toBe(true);
    const spot = { where: 'inside' };
    canvas().onInsert(spot);
    expect(p.insert).toHaveBeenCalledWith(block, spot);
  });

  it('inserts nothing when no block is pending', () => {
    const p = props();
    render(<CanvasArea {...p} />);
    canvas().onInsert({});
    expect(p.insert).not.toHaveBeenCalled();
  });

  it('clears the pending block when the drop is done', () => {
    const p = props();
    render(<CanvasArea {...p} />);
    canvas().onPendingDone();
    expect(p.ui.setPending).toHaveBeenCalledWith(null);
  });

  it('writes edited text through the undo history, keeping the surrounding whitespace', () => {
    const p = props();
    render(<CanvasArea {...p} />);
    const node = document.createTextNode('  Hello  ');
    canvas().onEditText(node, 'World');
    expect(p.mutate).toHaveBeenCalledTimes(1);
    expect(node.data).toBe('  World  ');
    expect(toasts).toEqual([]);
  });

  it('warns when the edit replaces a server-filled value with fixed text', () => {
    render(<CanvasArea {...props()} />);
    const node = document.createTextNode('{{page.title}}');
    act(() => {
      canvas().onEditText(node, 'Fixed');
    });
    expect(node.data).toBe('Fixed');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ isError: true });
    expect(toasts[0].text).toContain('filled in by the server');
  });
});

describe('CanvasArea highlight', () => {
  it('outlines a stylesheet selector while the Style tab shows one', () => {
    render(<CanvasArea {...props({ ui: { tab: 'style' }, stylesheet: { target: '.hero' } })} />);
    expect(canvas().highlight).toBe('.hero');
  });

  it('outlines nothing for the element’s own inline styles', () => {
    render(<CanvasArea {...props({ ui: { tab: 'style' }, stylesheet: { target: INLINE } })} />);
    expect(canvas().highlight).toBe('');
  });

  it('outlines nothing on any other tab', () => {
    render(<CanvasArea {...props({ ui: { tab: 'insert' }, stylesheet: { target: '.hero' } })} />);
    expect(canvas().highlight).toBe('');
  });
});

describe('CanvasArea code view', () => {
  it('shows the code pane, keeps the canvas mounted but hidden, and hands the pane the draft', () => {
    const p = props({ ui: { view: 'code' } });
    render(<CanvasArea {...p} />);
    expect(screen.getByTestId('code-pane')).toBeInTheDocument();
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(canvas().hidden).toBe(true);
    expect(probe.code).toMatchObject({
      path: '/etc/www/index.html',
      codeTarget: '',
      sheets: ['/etc/www/a.css'],
      scripts: ['/etc/www/a.js'],
      cssPath: '/etc/www/a.css',
      code: '<p>hi</p>',
      codeEditId: 5,
      setCode: p.codeDraft.setCode,
      setDirty: p.documentState.setDirty,
      switchCodeTarget: p.switchCodeTarget,
      save: p.save,
    });
    expect(screen.queryByTestId('live-pane')).not.toBeInTheDocument();
  });

  it('points the prompt bar at the page as html when it is the file being edited', () => {
    render(<CanvasArea {...props({ ui: { view: 'code' } })} />);
    expect(ai().fileType).toBe('html');
    expect(ai().session).toBe('/etc/www/index.html');
    expect(ai().getOldCode()).toBe('<p>hi</p>');
    expect(ai().getContext()).toBe(aiContextForFile('/etc/www/index.html', '<p>hi</p>'));
  });

  it('points the prompt bar at a stylesheet as css when one is the target', () => {
    render(
      <CanvasArea
        {...props({
          ui: { view: 'code' },
          codeDraft: { codeTarget: '/etc/www/a.css', code: 'p{}' },
        })}
      />,
    );
    expect(ai().fileType).toBe('css');
    expect(ai().session).toBe('/etc/www/a.css');
    expect(ai().getContext()).toBe(aiContextForFile('/etc/www/a.css', 'p{}'));
  });

  it('treats a script target as html, as the prompt bar only knows css apart', () => {
    render(
      <CanvasArea
        {...props({ ui: { view: 'code' }, codeDraft: { codeTarget: '/etc/www/a.js' } })}
      />,
    );
    expect(ai().fileType).toBe('html');
    expect(ai().session).toBe('/etc/www/a.js');
  });

  it('puts a generated result into the draft and marks the page dirty', () => {
    const p = props({ ui: { view: 'code' } });
    render(<CanvasArea {...p} />);
    ai().onResult('<p>generated</p>');
    expect(p.codeDraft.setCode).toHaveBeenCalledWith('<p>generated</p>');
    expect(p.codeDraft.bumpCodeEditId).toHaveBeenCalledTimes(1);
    expect(p.documentState.setDirty).toHaveBeenCalledWith(true);
  });

  it('toasts a prompt error', () => {
    render(<CanvasArea {...props({ ui: { view: 'code' } })} />);
    ai().onError('quota used');
    expect(toasts).toEqual([expect.objectContaining({ text: 'quota used', isError: true })]);
  });

  it('starts the prompt bar afresh for another file but not for another render of the same one', () => {
    const { rerender } = render(<CanvasArea {...props({ ui: { view: 'code' } })} />);
    expect(probe.aiMounts).toBe(1);
    rerender(<CanvasArea {...props({ ui: { view: 'code' }, codeDraft: { code: 'changed' } })} />);
    expect(probe.aiMounts).toBe(1);
    rerender(
      <CanvasArea
        {...props({ ui: { view: 'code' }, codeDraft: { codeTarget: '/etc/www/a.css' } })}
      />,
    );
    expect(probe.aiMounts).toBe(2);
  });
});

describe('CanvasArea live view', () => {
  it('shows the live pane with the cloudlet details and no prompt bar', () => {
    const p = props({ ui: { view: 'live', width: 768 } });
    render(<CanvasArea {...p} />);
    expect(screen.getByTestId('live-pane')).toBeInTheDocument();
    expect(probe.live).toMatchObject({
      path: '/etc/www/index.html',
      origin: 'https://cloud.example',
      width: 768,
      sameOrigin: true,
      liveWarned: false,
      warnedKey: 'k',
      setLiveWarned: p.cloudlet.setLiveWarned,
    });
    expect(canvas().hidden).toBe(true);
    expect(screen.queryByTestId('ai-prompt')).not.toBeInTheDocument();
    expect(screen.queryByText(/Select something on the canvas/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('code-pane')).not.toBeInTheDocument();
  });
});
