/*
 * Training data tab.
 */

import { useEffect, useState } from 'react';
import AiWaiter from '../../components/AiWaiter';
import { useDialog } from '../../components/Dialogs';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Select from '../../components/Select';
import SocketFeedback from '../../components/SocketFeedback';
import SortHeader, { useSort } from '../../components/SortHeader';
import {
  gibberish,
  importPage,
  mlSnippetDelete,
  mlSnippets,
  mlSnippetsCount,
  mlSnippetsDeleteAll,
  mlSnippetsExportRaw,
} from '../../lib/api';
import { dispositionFilename, downloadBlob } from '../../lib/download';
import { showToast } from '../../lib/toast';
import { usePagedList } from '../../lib/usePagedList';
import AddFunctionDialog from './AddFunctionDialog';
import AddWidgetDialog from './AddWidgetDialog';
import EditSnippetDialog from './EditSnippetDialog';
import SpiceDialog from './SpiceDialog';

export default function TrainingTab(props: {
  types: any[];
  // A model the command palette asked to filter by, resolved by the page above.
  initialType?: string | null;
}) {

  const PAGE_SIZE = 12;
  const [type, setType] = useState(props.initialType ?? '');

  // The page stays mounted between palette jumps, so a later link still lands.
  useEffect(() => {
    if (props.initialType) {
      setType(props.initialType);
    }
  }, [props.initialType]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [pickingFunction, setPickingFunction] = useState(false);
  const [pickingWidget, setPickingWidget] = useState(false);
  const [spicing, setSpicing] = useState(false);
  const [scraping, setScraping] = useState<{ channel: string; options: any } | null>(null);
  const [vectorSearch, setVectorSearch] = useState(false);
  const [sort, setSort] = useSort();
  // Slow round-trips with nothing else on screen to show for them — deletes,
  // exports, and scrape channel setup.
  const [waiting, setWaiting] = useState(false);
  const { confirm, confirmTyped } = useDialog();

  // Vector search only means anything once there's something to search for.
  const searchingByVector = vectorSearch && !!filter;

  /*
   * A snippet only makes it into the model's context when its distance is
   * near enough — the model's threshold decides where that line falls, and
   * anything past it is shown greyed out.
   */
  const threshold = props.types.find(candidate => candidate.type === type)?.threshold;
  const inContext = (snippet: any) =>
    typeof snippet.distance !== 'number' || typeof threshold !== 'number'
      ? true
      : snippet.distance + threshold < 1;

  useEffect(() => {
    if (!type && props.types.length > 0) {
      setType(props.types[0].type);
    }
  }, [props.types, type]);

  const list = usePagedList<any>({
    load: async (offset, limit) => {
      // No type selected yet — nothing to ask the backend for.
      if (!type) {
        return { rows: [], count: 0 };
      }
      const [rows, total] = await Promise.all([
        mlSnippets(type, filter, offset, limit, sort, searchingByVector),
        // Vector search ranks the whole type rather than filtering it, so its
        // count ignores the filter — mlSnippetsCount handles that itself.
        mlSnippetsCount(type, filter, searchingByVector),
      ]);
      return { rows: rows ?? [], count: total.count };
    },
    pageSize: PAGE_SIZE,
    filter,
    deps: [type, sort, searchingByVector],
  });
  const snippets = list.rows;
  const count = list.count;

  async function remove(snippet: any) {
    if (!await confirm({
      title: 'Delete training snippet?',
      message: snippet.prompt?.substring(0, 100),
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    setWaiting(true);
    try {
      await mlSnippetDelete(snippet.id);
      list.refresh();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Deletes every snippet the current filter matches, not just the page on
   * screen — so it asks for the count to be typed back.
   */
  async function removeFiltered() {
    if (!await confirmTyped({
      title: 'Delete all filtered snippets?',
      message: 'This permanently deletes all ' + count + ' snippet(s) matching the ' +
        'current filter in ' + type + '. Type the number to confirm.',
      label: 'Number of snippets',
      expected: String(count),
      confirmText: 'Delete',
      mismatch: 'Number did not match — nothing deleted',
    })) {
      return;
    }
    setWaiting(true);
    try {
      await mlSnippetsDeleteAll(type, filter);
      showToast(count + ' snippet(s) deleted');
      list.setPage(0);
      list.refresh();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  // Scraping runs on a background thread, so it reports over a socket channel.
  async function spice(options: any) {
    setSpicing(false);
    setWaiting(true);
    try {
      setScraping({ channel: (await gibberish()).result, options });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function exportSnippets() {
    setWaiting(true);
    try {
      const raw = await mlSnippetsExportRaw(type, filter);
      downloadBlob(raw.blob, dispositionFilename(raw.disposition) ?? type + '.csv');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <Select value={type} onChange={value => setType(value)}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </Select>
        <SearchInput
          placeholder={vectorSearch ? 'Search meaning…' : 'Filter prompts…'}
          value={filter}
          onChange={setFilter}
          style={{ width: 240 }} />
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Use vector semantic search to find snippets by meaning rather than by text — only works once you have vectorised this model">
          <input
            type="checkbox"
            checked={vectorSearch}
            onChange={e => setVectorSearch(e.target.checked)} />
          Vector search
        </label>
        <span className="muted">{count} snippets</span>
        <span className="spacer" />
        <button
          className="btn btn-danger btn-small"
          disabled={count === 0 || searchingByVector}
          title={searchingByVector
            ? 'Vector search ranks snippets rather than filtering them, so there is no filter to delete by'
            : filter
              ? 'Delete every snippet matching the filter'
              : 'Delete every snippet in ' + type}
          onClick={removeFiltered}>
          {filter ? 'Delete filtered' : 'Delete all'}
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={count === 0 || searchingByVector}
          title={searchingByVector
            ? 'Vector search ranks snippets rather than filtering them, so there is no filter to export'
            : 'Download every snippet matching the filter as CSV'}
          onClick={exportSnippets}>
          Export
        </button>
        <button
          className="btn btn-secondary"
          title="Scrape a single web page into this model"
          onClick={() => setSpicing(true)}>
          + Spice
        </button>
        <button
          className="btn btn-secondary"
          title="Add an HTML widget this model can render"
          onClick={() => setPickingWidget(true)}>
          + Widget
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setPickingFunction(true)}>
          + AI function
        </button>
        <button className="btn" onClick={() => setEditing('new')}>+ New snippet</button>
        <Pagination page={list.page} pageCount={list.pageCount} onPage={list.setPage} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {snippets === null ? (
          <div className="spinner-panel"><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <SortHeader column="prompt" label="Prompt" sort={sort} onSort={setSort} />
                {/* tokens is a computed column — the API cannot order by it. */}
                <th style={{ width: 90 }}>Tokens</th>
                {searchingByVector && <th style={{ width: 100 }}>Distance</th>}
                <th style={{ width: 110 }}>Embedded</th>
                <th style={{ width: 150 }}></th>
              </tr>
            </thead>
            <tbody>
              {snippets.map(snippet => (
                <tr
                  key={snippet.id}
                  className={searchingByVector
                    ? (inContext(snippet) ? 'vss-relevant' : 'vss-irrelevant')
                    : undefined}
                  title={searchingByVector
                    ? (inContext(snippet)
                      ? 'Close enough to be included in the model\'s context'
                      : 'Too distant for the model\'s ' + threshold + ' threshold — ' +
                        'this would not be included in the context')
                    : undefined}>
                  <td style={{
                    maxWidth: 520,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {snippet.prompt}
                  </td>
                  <td data-label="Tokens">{snippet.tokens}</td>
                  {searchingByVector && (
                    <td className="mono" data-label="Distance">
                      {typeof snippet.distance === 'number'
                        ? snippet.distance.toFixed(3)
                        : <span className="muted">—</span>}
                    </td>
                  )}
                  <td data-label="Embedded">
                    <span
                      className={'status-dot ' + (snippet.embedding_vss ? 'ok' : 'pending')}
                      role="img"
                      aria-label={snippet.embedding_vss ? 'Embedded' : 'Not embedded'}
                      title={snippet.embedding_vss
                        ? 'Embedded — this snippet is vectorised and searchable'
                        : 'Not embedded — vectorise this model to include it'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => setEditing(snippet)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => remove(snippet)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {snippets.length === 0 && (
                <tr>
                  <td className="muted" colSpan={searchingByVector ? 5 : 4}>
                    No training snippets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {editing !== null && (
        <EditSnippetDialog
          type={type}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); list.refresh(); }} />
      )}
      {pickingFunction && (
        <AddFunctionDialog
          type={type}
          onClose={() => setPickingFunction(false)}
          onInstalled={() => { setPickingFunction(false); list.refresh(); }} />
      )}
      {pickingWidget && (
        <AddWidgetDialog
          type={type}
          onClose={() => setPickingWidget(false)}
          onAdded={() => { setPickingWidget(false); list.refresh(); }} />
      )}
      {spicing && (
        <SpiceDialog
          type={type}
          onClose={() => setSpicing(false)}
          onScrape={spice} />
      )}
      {scraping && (
        <SocketFeedback
          title={'Scraping ' + scraping.options.url}
          channel={scraping.channel}
          onReady={() => {
            importPage({ ...scraping.options, type, channel: scraping.channel })
              .catch(err => showToast(err.message, true, err.logId));
          }}
          onClose={() => { setScraping(null); list.refresh(); }} />
      )}
      {/*
        * Vector search embeds the query through OpenAI first, so unlike the
        * text filter it's slow enough to need a waiter.
        */}
      {(waiting || (searchingByVector && list.loading)) && <AiWaiter />}
    </>
  );
}
