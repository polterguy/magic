/*
 * Unit tests for the dashboard's pure helpers — the MCP URL, which agent
 * plugins are missing, task paging, and finding the chatbot a crawl built.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, it, expect } from 'vitest';
import {
  TASK_PAGE_SIZE,
  chatbotModelFromProgress,
  mcpEndpointUrl,
  missingAgentPlugins,
  taskPageCount,
} from './constants';

describe('mcpEndpointUrl', () => {
  it('appends the MCP module path to the backend URL', () => {
    expect(mcpEndpointUrl('https://example.com')).toBe('https://example.com/magic/modules/mcp/mcp');
  });

  it('falls back to a relative path without a backend', () => {
    expect(mcpEndpointUrl(undefined)).toBe('/magic/modules/mcp/mcp');
  });
});

describe('missingAgentPlugins', () => {
  it('lists both plugins when neither folder exists', () => {
    expect(missingAgentPlugins(['/modules/other/'])).toEqual(['mcp', 'oauth']);
  });

  it('lists only the plugin whose folder is missing', () => {
    expect(missingAgentPlugins(['/modules/mcp/'])).toEqual(['oauth']);
  });

  it('lists nothing when both are installed', () => {
    expect(missingAgentPlugins(['/modules/oauth/', '/modules/mcp/'])).toEqual([]);
  });

  it('matches whole folder paths only', () => {
    expect(missingAgentPlugins(['/modules/mcp', '/modules/oauth-extra/'])).toEqual([
      'mcp',
      'oauth',
    ]);
  });
});

describe('taskPageCount', () => {
  it('is one page while the count is unknown', () => {
    expect(taskPageCount(null)).toBe(1);
  });

  it('is at least one page', () => {
    expect(taskPageCount(0)).toBe(1);
  });

  it('rounds partial pages up', () => {
    expect(taskPageCount(TASK_PAGE_SIZE)).toBe(1);
    expect(taskPageCount(TASK_PAGE_SIZE + 1)).toBe(2);
  });
});

describe('chatbotModelFromProgress', () => {
  it('reads the landing page name the wizard announces', () => {
    const text =
      'Crawling…\nCreating default landing page for example-com by copying https://example.com';
    expect(chatbotModelFromProgress(text)).toBe('example-com');
  });

  it('falls back to the quoted model name', () => {
    expect(chatbotModelFromProgress("Vectorising model 'example-com'")).toBe('example-com');
  });

  it('prefers the landing page over the model name', () => {
    expect(
      chatbotModelFromProgress("model 'first'\nCreating default landing page for second by"),
    ).toBe('second');
  });

  it('is undefined when neither is mentioned', () => {
    expect(chatbotModelFromProgress('Done!')).toBeUndefined();
  });
});
