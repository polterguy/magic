// @vitest-environment jsdom
/*
 * Quality panel: each audit check run against real parsed documents (head title /
 * description / viewport, images, duplicate ids, links, heading order, empty elements,
 * and the elements it deliberately skips), grouping and counts, and selecting the
 * element a finding is about.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Quality from '../Quality';

const CLEAN_HEAD =
  '<title>Home</title><meta name="description" content="d"><meta name="viewport" content="width=device-width">';

function page(body: string, head = CLEAN_HEAD) {
  return new DOMParser().parseFromString(
    `<!doctype html><html><head>${head}</head><body>${body}</body></html>`,
    'text/html',
  );
}

function renderQuality(doc: Document | null, urls: string[] = ['/', '/about']) {
  const onSelect = vi.fn();
  render(<Quality doc={doc} urls={urls} onSelect={onSelect} />);
  return { onSelect };
}

const details = () => screen.getAllByRole('button').map(b => b.textContent);

describe('Quality overall states', () => {
  it('says so when no page is open', () => {
    renderQuality(null);
    expect(screen.getByText('No page open.')).toBeInTheDocument();
  });

  it('reports a clean page', () => {
    renderQuality(page('<h1>Hi</h1><p>text</p><a href="/about">About</a>'));
    expect(screen.getByText('Nothing to report. The page checks out.')).toBeInTheDocument();
  });

  it('says "One thing" for a single finding and counts several', () => {
    const { unmount } = render(
      <Quality doc={page('<img src="a.png">')} urls={[]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/One thing worth a look/)).toBeInTheDocument();
    unmount();
    render(<Quality doc={page('<img>')} urls={[]} onSelect={vi.fn()} />);
    expect(screen.getByText(/2 things worth a look/)).toBeInTheDocument();
  });
});

describe('Quality head checks', () => {
  it('reports a missing title, description and viewport as page-level findings', () => {
    renderQuality(page('<p>x</p>', ''));
    expect(screen.getByText(/No title\./)).toBeInTheDocument();
    expect(screen.getByText(/No description\./)).toBeInTheDocument();
    expect(screen.getByText(/No viewport\./)).toBeInTheDocument();
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'This is about the page itself');
    }
  });

  it('treats a blank title as missing', () => {
    renderQuality(page('<p>x</p>', CLEAN_HEAD.replace('Home', '   ')));
    expect(screen.getByText(/No title\./)).toBeInTheDocument();
  });
});

describe('Quality body checks', () => {
  it('flags images without alt or source, and accepts empty alt', () => {
    renderQuality(page('<img src="a.png" alt=""><img src="b.png"><img alt="x">'));
    expect(screen.getByText(/No alt attribute/)).toBeInTheDocument();
    expect(screen.getByText('No source.')).toBeInTheDocument();
    expect(screen.getAllByText(/No alt attribute/)).toHaveLength(1);
  });

  it('flags duplicate ids once per extra use', () => {
    renderQuality(page('<p id="a">1</p><p id="a">2</p><p id="a">3</p><p id="b">4</p>'));
    expect(screen.getAllByText(/"a" is used more than once/)).toHaveLength(2);
    expect(screen.queryByText(/"b"/)).not.toBeInTheDocument();
  });

  it('flags links with no content, no address or a dead internal target', () => {
    renderQuality(
      page(
        '<a href="/about"></a>' +
          '<a>nothing</a>' +
          '<a href="  ">blank</a>' +
          '<a href="/gone">gone</a>' +
          '<a href="/about/#top">fine</a>' +
          '<a href="/file.pdf">file</a>' +
          '<a href="//cdn.test/x">proto</a>' +
          '<a href="https://example.com">out</a>' +
          '<a href="/about" aria-label="About"></a>' +
          '<a href="/about"><img src="i.png" alt="i"></a>',
      ),
    );
    expect(screen.getByText('Nothing to click and nothing to read.')).toBeInTheDocument();
    expect(screen.getAllByText('No address.')).toHaveLength(2);
    expect(screen.getAllByText(/does not match any page on this site/)).toHaveLength(1);
    expect(screen.getByText('/gone does not match any page on this site.')).toBeInTheDocument();
  });

  it('flags skipped heading levels and multiple h1s', () => {
    renderQuality(page('<h1>A</h1><h3>B</h3><h2>C</h2><h1>D</h1>'));
    expect(screen.getByText('h3 follows h1, skipping a level.')).toBeInTheDocument();
    expect(screen.getByText('More than one h1 on the page.')).toBeInTheDocument();
    expect(screen.queryByText(/h2 follows/)).not.toBeInTheDocument();
  });

  it('flags elements that hold nothing, but not media, svg or void tags', () => {
    renderQuality(
      page(
        '<div class="empty"></div><p>   </p><svg><path d="M0"></path></svg>' +
          '<video></video><br><hr><span>text</span>',
      ),
    );
    expect(screen.getAllByText('Holds nothing at all.')).toHaveLength(2);
  });

  it('groups findings by kind, in discovery order', () => {
    renderQuality(page('<img src="a.png"><h1>A</h1><h3>B</h3>', ''));
    const groups = Array.from(document.querySelectorAll('.designer-meta-group')).map(
      el => el.textContent,
    );
    expect(groups).toEqual(['Page', 'Image', 'Headings']);
  });
});

describe('Quality selection', () => {
  it('selects the element a finding is about', async () => {
    const doc = page('<img src="a.png">');
    const { onSelect } = renderQuality(doc);
    await userEvent.click(screen.getByRole('button', { name: /No alt attribute/ }));
    expect(onSelect).toHaveBeenCalledWith(doc.querySelector('img'));
  });

  it('labels each finding with the element it is about', () => {
    renderQuality(page('<img src="a.png">'));
    const button = screen.getByRole('button', { name: /No alt attribute/ });
    expect(button).toHaveAttribute('title', 'Select it');
    expect(button.querySelector('.designer-finding-where')?.textContent).toMatch(/img/i);
  });

  it('does not select anything for a page-level finding', async () => {
    const { onSelect } = renderQuality(page('<p>x</p>', ''));
    await userEvent.click(screen.getByRole('button', { name: /No title/ }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(details()[0]).toMatch(/^Page/);
  });
});
