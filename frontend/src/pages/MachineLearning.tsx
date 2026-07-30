import SearchInput from '../components/SearchInput';
import Select from '../components/Select';
import { dispositionFilename, downloadBlob } from '../components/ResultViewer';
import { copyToClipboard, showToast } from '../lib/toast';
import Banner from '../components/Banner';
import { useCallback, useEffect, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import AiPrompt from '../components/AiPrompt';
import { Modal, useDialog } from '../components/Dialogs';
import SocketFeedback from '../components/SocketFeedback';
import CreateSystemMessageDialog from '../components/CreateSystemMessageDialog';
import Tabs from '../components/Tabs';
import SortHeader, { SortState, useSort } from '../components/SortHeader';
import {
  availableWidgets,
  availableWorkflows,
  backendInfo,
  getFunctionDeclaration,
  gibberish,
  importPage,
  importUrl,
  listRoles,
  mlRequests,
  mlSnippetCreate,
  mlSnippetDelete,
  mlSnippets,
  deleteVectors,
  mlSnippetsCount,
  mlUnvectorisedCount,
  mlSnippetsDeleteAll,
  mlSnippetsExportRaw,
  mlSnippetUpdate,
  mlTypeCreate,
  mlTypeDelete,
  mlTypes,
  mlTypeUpdate,
  openaiCompletionSlots,
  openaiIsConfigured,
  openaiModels,
  modelPriceLabel,
  openaiSystemMessages,
  openaiThemes,
  uploadCsvFile,
  uploadImageFile,
  uploadUrlList,
  uploadTrainingFile,
  vectoriseType,
} from '../lib/api';

type Tab = 'types' | 'training' | 'history';

/*
 * Notifications go to the toast stack. An inline banner is part of the page,
 * so showing one pushed everything below it down — the editors and grids
 * jumped under the pointer. Toasts float above the page instead.
 */
function setFeedback(value: { text: string; isError: boolean } | null) {
  if (value) {
    showToast(value.text, value.isError);
  }
}

export default function MachineLearning() {

  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [configured, setConfigured] = useState(true);

  const refreshTypes = useCallback(async () => {
    try {
      setTypes(await mlTypes() ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, []);

  useEffect(() => {
    refreshTypes();
    openaiIsConfigured()
      .then(response => setConfigured(response.result))
      .catch(() => {});
  }, [refreshTypes]);

  return (
    <>
      <div className="page-header">
        <h1>Machine Learning</h1>
        <p>Your AI models, training data, and AI functions</p>
      </div>
      <Tabs
        tabs={[
          { id: 'types', label: 'Models' },
          { id: 'training', label: 'Training data' },
          { id: 'history', label: 'History' },
        ]}
        active={tab}
        onChange={id => setTab(id as Tab)} />
      {!configured && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          OpenAI is not configured — add your API key in Configuration before
          training or querying models.
        </div>
      )}
      {tab === 'types' &&
        <TypesTab types={types} onChanged={refreshTypes} notify={setFeedback} />}
      {tab === 'training' &&
        <TrainingTab types={types} notify={setFeedback} />}
      {tab === 'history' &&
        <HistoryTab types={types} notify={setFeedback} />}
    </>
  );
}

/*
 * Models tab — the ml_types registry.
 */
function TypesTab(props: {
  types: any[];
  onChanged: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [vectorising, setVectorising] =
    useState<{ type: string; channel: string; total: number } | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<string | null>(null);
  const { confirm, prompt } = useDialog();

  async function remove(type: string) {
    const typed = await prompt({
      title: 'Delete model?',
      message: 'This deletes the model and its training data. Type the model name to confirm.',
      label: 'Model name',
      confirmText: 'Delete',
    });
    if (typed !== type) {
      if (typed !== null) {
        props.notify({ text: 'Name did not match — nothing deleted', isError: true });
      }
      return;
    }
    try {
      await mlTypeDelete(type);
      props.notify({ text: 'Model ' + type + ' deleted', isError: false });
      props.onChanged();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  async function vectorise(type: string) {
    try {
      // Snippets without embeddings are exactly the ones about to be vectorised.
      let total = (await mlUnvectorisedCount(type)).count;

      /*
       * Nothing left to vectorise means the model is already fully vectorised,
       * and the vectoriser would do nothing at all. Re-vectorising is still a
       * legitimate thing to want - a changed vector model, or suspect vectors -
       * but it means throwing away every existing embedding first, so the user
       * has to agree to that before we reset them.
       */
      if (total === 0) {
        const all = (await mlSnippetsCount(type, '')).count;
        if (all === 0) {
          props.notify({ text: 'No training snippets in ' + type + ' to vectorise', isError: true });
          return;
        }
        if (!await confirm({
          title: 'Re-vectorise ' + type + '?',
          message: 'Every snippet in ' + type + ' is already vectorised. Continuing ' +
            'deletes all ' + all + ' existing vectors and creates ' + all + ' new embeddings, ' +
            'which costs OpenAI credits.',
          confirmText: 'Delete vectors and re-vectorise',
          danger: true,
        })) {
          return;
        }
        await deleteVectors(type);
        total = all;
      }
      const channel = (await gibberish()).result;
      setVectorising({ type, channel, total });
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  return (
    <>
      <div className="toolbar">
        <span className="muted">{props.types.length} models</span>
        <span className="spacer" />
        <button className="btn" onClick={() => setEditing('new')}>+ New model</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Model</th>
              <th style={{ width: 110 }}>Embeddings</th>
              <th style={{ width: 330 }}></th>
            </tr>
          </thead>
          <tbody>
            {props.types.map(type => (
              <tr key={type.type}>
                <td><strong>{type.type}</strong></td>
                <td className="mono" data-label="Model">{type.model}</td>
                <td data-label="Embeddings">{type.use_embeddings ? 'yes' : 'no'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setImporting(type.type)}>
                      Import
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => vectorise(type.type)}>
                      Vectorise
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEmbedding(type.type)}>
                      Embed
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditing(type)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => remove(type.type)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <EditTypeDialog
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); props.onChanged(); }}
          notify={props.notify} />
      )}
      {vectorising && (
        <SocketFeedback
          title={'Vectorising ' + vectorising.type}
          channel={vectorising.channel}
          progress={{
            total: vectorising.total,
            // The vectoriser announces every snippet it embeds with this prefix.
            counts: message => message.message.startsWith('Vectorizing:'),
          }}
          onReady={() => {
            vectoriseType(vectorising.type, vectorising.channel)
              .catch(err => props.notify({ text: err.message, isError: true }));
          }}
          onClose={() => setVectorising(null)} />
      )}
      {importing && (
        <ImportDialog
          type={importing}
          onClose={() => setImporting(null)}
          notify={props.notify} />
      )}
      {embedding && (
        <EmbedDialog type={embedding} onClose={() => setEmbedding(null)} />
      )}
    </>
  );
}

/*
 * The file categories the old dashboard supports, each mapping to its own
 * backend endpoint and accepted extensions.
 */
const UPLOAD_CATEGORIES = {
  structured: {
    label: 'Structured data (CSV, XML, YAML, JSON)',
    accept: '.csv,.xml,.yaml,.yml,.json',
    help: 'Files containing lists of objects with at least two fields. ' +
      'Declare which field becomes the prompt and which the completion below.',
  },
  text: {
    label: 'Text (TXT, Markdown, CSV as text)',
    accept: '.txt,.md,.csv',
    help: 'Plain-text files imported as content, optionally summarized.',
  },
  pdf: {
    label: 'PDF documents',
    accept: '.pdf',
    help: 'PDF files, optionally one snippet per page or AI-summarized.',
  },
  csv: {
    label: 'CSV — first column prompt, rest completion',
    accept: '.csv',
    help: 'Imports every row using the first column as prompt, and all ' +
      'remaining columns concatenated as the completion.',
  },
  images: {
    label: 'Images (PNG, JPG, WEBP, GIF)',
    accept: '.png,.jpg,.jpeg,.webp,.gif',
    help: 'Images vectorised and stored as training data.',
  },
  urls: {
    label: 'URL list (CSV of URLs to scrape)',
    accept: '.csv',
    help: 'Scrapes every URL in the file. The CSV must have a header row and ' +
      'exactly one column, containing nothing but http:// or https:// URLs.',
  },
};

/*
 * Import dialog — crawl a website (progress over the socket), or upload
 * training files.
 */
function ImportDialog(props: {
  type: string;
  onClose: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [tab, setTab] = useState('crawl');
  // Crawl-tab options, defaulted the way the old dashboard defaults them.
  const [url, setUrl] = useState('');
  const [delay, setDelay] = useState('1');
  const [max, setMax] = useState('25');
  const [threshold, setThreshold] = useState('150');
  const [meta, setMeta] = useState('');
  const [summarize, setSummarize] = useState(true);
  const [insertUrl, setInsertUrl] = useState(false);
  const [images, setImages] = useState(true);
  const [lists, setLists] = useState(true);
  const [code, setCode] = useState(true);

  // URL-list tab: a single-column CSV of URLs to scrape.
  const [urlListFile, setUrlListFile] = useState<File | null>(null);
  const [urlListVectorize, setUrlListVectorize] = useState(false);
  const [scraping, setScraping] = useState<string | null>(null);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Upload-tab options.
  const [category, setCategory] = useState<keyof typeof UPLOAD_CATEGORIES>('structured');
  const [promptField, setPromptField] = useState('prompt');
  const [completionField, setCompletionField] = useState('completion');
  const [textSummarize, setTextSummarize] = useState(false);
  const [pdfPreservePages, setPdfPreservePages] = useState(false);
  const [pdfSummarize, setPdfSummarize] = useState(false);
  const [pdfOverwrite, setPdfOverwrite] = useState(false);
  const [pdfMassage, setPdfMassage] = useState('');

  async function crawl() {
    if (!url) {
      return;
    }
    try {
      const channel = (await gibberish()).result;
      setCrawling(channel);
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  async function upload(files: File[]) {
    /*
     * A URL list is scraped asynchronously with progress over the socket,
     * so it takes the feedback-channel route rather than a plain upload.
     */
    if (category === 'urls') {
      try {
        setUrlListFile(files[0]);
        setScraping((await gibberish()).result);
      } catch (err: any) {
        props.notify({ text: err.message, isError: true });
      }
      return;
    }
    setUploading(true);
    let count = 0;
    try {
      for (const file of files) {
        let response: { count: number };
        if (category === 'images') {
          response = await uploadImageFile(props.type, file);
        } else if (category === 'csv') {
          response = await uploadCsvFile(props.type, file);
        } else if (category === 'pdf') {
          response = await uploadTrainingFile(props.type, file, {
            summarize: pdfSummarize,
            preservePages: pdfPreservePages,
            overwrite: pdfOverwrite,
            massage: pdfMassage || undefined,
          });
        } else if (category === 'text') {
          response = await uploadTrainingFile(props.type, file, {
            summarize: textSummarize,
            forceAsText: file.name.toLowerCase().endsWith('.csv'),
          });
        } else {
          response = await uploadTrainingFile(props.type, file, {
            promptField,
            completionField,
          });
        }
        count += response.count ?? 0;
      }
      const noun = category === 'images' ? 'image(s) imported' : 'training snippets imported';
      props.notify({ text: count + ' ' + noun, isError: false });
      props.onClose();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Modal width={620} onClose={props.onClose} onSubmit={() => { if (url) crawl(); }}>
        <h2>Import into {props.type}</h2>
        <Tabs
          tabs={[
            { id: 'crawl', label: 'Crawl website' },
            { id: 'upload', label: 'Upload files' },
          ]}
          active={tab}
          onChange={setTab} />
        {tab === 'crawl' && (
          <div className="form-grid">
            <label>Website URL
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)} />
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}>
              <label>Max pages
                <input
                  type="number"
                  min={1}
                  max={5000}
                  title="Maximum number of URLs to crawl"
                  value={max}
                  onChange={e => setMax(e.target.value)} />
              </label>
              <label>Delay (seconds)
                <input
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.5}
                  title="Delay between each page requested"
                  value={delay}
                  onChange={e => setDelay(e.target.value)} />
              </label>
              <label>Text threshold
                <input
                  type="number"
                  min={25}
                  title="Minimum character count for a page to become a training snippet"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)} />
              </label>
            </div>
            <label>Meta value
              <input
                type="text"
                placeholder="AINIRO-Website-Crawler"
                title="Tag associated with every snippet the crawl creates"
                value={meta}
                onChange={e => setMeta(e.target.value)} />
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, max-content)',
              gap: '6px 24px',
            }}>
              <label
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                title="Summarize snippets too long to be used effectively">
                <input
                  type="checkbox"
                  checked={summarize}
                  onChange={e => setSummarize(e.target.checked)} />
                Summarize pages
              </label>
              <label
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                title="Insert the source URL into the completion of each snippet">
                <input
                  type="checkbox"
                  checked={insertUrl}
                  onChange={e => setInsertUrl(e.target.checked)} />
                Insert source URL
              </label>
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={images}
                  onChange={e => setImages(e.target.checked)} />
                Import images
              </label>
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={lists}
                  onChange={e => setLists(e.target.checked)} />
                Import lists
              </label>
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={code}
                  onChange={e => setCode(e.target.checked)} />
                Import code segments
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
              <button className="btn" onClick={crawl} disabled={!url}>Start crawling</button>
            </div>
          </div>
        )}
        {tab === 'upload' && (
          <div className="form-grid">
            <label>File category
              <Select
                value={category}
                onChange={value => setCategory(value as keyof typeof UPLOAD_CATEGORIES)}>
                {Object.entries(UPLOAD_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Select>
            </label>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {UPLOAD_CATEGORIES[category].help}
            </p>
            {category === 'structured' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>Prompt field
                  <input
                    type="text"
                    value={promptField}
                    onChange={e => setPromptField(e.target.value)} />
                </label>
                <label>Completion field
                  <input
                    type="text"
                    value={completionField}
                    onChange={e => setCompletionField(e.target.value)} />
                </label>
              </div>
            )}
            {category === 'text' && (
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={textSummarize}
                  onChange={e => setTextSummarize(e.target.checked)} />
                Summarize each file for better retrieval
              </label>
            )}
            {category === 'urls' && (
              <label
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                title="Create summary prompts for each snippet, improving RAG and VSS lookups">
                <input
                  type="checkbox"
                  checked={urlListVectorize}
                  onChange={e => setUrlListVectorize(e.target.checked)} />
                Vectorise when done
              </label>
            )}
            {category === 'pdf' && (
              <>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={pdfPreservePages}
                      onChange={e => setPdfPreservePages(e.target.checked)} />
                    One snippet per page
                  </label>
                  <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={pdfSummarize}
                      onChange={e => setPdfSummarize(e.target.checked)} />
                    Summarize
                  </label>
                  <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={pdfOverwrite}
                      onChange={e => setPdfOverwrite(e.target.checked)} />
                    Overwrite existing
                  </label>
                </div>
                <label>Massage prompt (optional — reshapes content with AI first)
                  <input
                    type="text"
                    value={pdfMassage}
                    onChange={e => setPdfMassage(e.target.value)} />
                </label>
              </>
            )}
            <label className="btn btn-secondary" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
              {uploading ? 'Uploading…' : 'Select files'}
              <input
                type="file"
                multiple
                accept={UPLOAD_CATEGORIES[category].accept}
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length > 0) {
                    upload(files);
                  }
                }} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
            </div>
          </div>
        )}
      </Modal>
      {crawling && (
        <SocketFeedback
          title={'Crawling ' + url}
          channel={crawling}
          onReady={() => {
            importUrl({
              url,
              type: props.type,
              // The backend wants milliseconds, the field asks for seconds.
              delay: Math.round(Number(delay) * 1000),
              max: Number(max),
              threshold: Number(threshold),
              summarize,
              insert_url: insertUrl,
              images,
              lists,
              code,
              meta,
              channel: crawling,
            }).catch(err => props.notify({ text: err.message, isError: true }));
          }}
          onClose={() => { setCrawling(null); props.onClose(); }} />
      )}
      {scraping && urlListFile && (
        <SocketFeedback
          title={'Scraping URLs from ' + urlListFile.name}
          channel={scraping}
          onReady={() => {
            uploadUrlList(props.type, urlListFile, scraping, urlListVectorize)
              .catch(err => props.notify({ text: err.message, isError: true }));
          }}
          onClose={() => { setScraping(null); props.onClose(); }} />
      )}
    </>
  );
}

function boolParam(name: string, value: boolean) {
  return name + '=' + (value ? 'true' : 'false');
}

/*
 * Embed dialog — builds the include-script for the modern chatbot.
 * Legacy classic-chatbot and AI-search embeds are intentionally dropped.
 */
function EmbedDialog(props: { type: string; onClose: () => void }) {

  const backend = backendInfo();
  const [modernThemes, setModernThemes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Modern chatbot options (old-dashboard defaults).
  const [modernTheme, setModernTheme] = useState('modern-square');
  const [header, setHeader] = useState('Ask about our services or products');
  const [buttonText, setButtonText] = useState('AI Chatbot');
  const [placeholder, setPlaceholder] = useState('Ask me anything ...');
  const [position, setPosition] = useState('right');
  const [animation, setAnimation] = useState('none');
  const [references, setReferences] = useState(false);
  const [followUp, setFollowUp] = useState(true);
  const [copyButton, setCopyButton] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [history, setHistory] = useState(false);
  const [attachments, setAttachments] = useState(false);
  const [startColor, setStartColor] = useState('#7892e5');
  const [endColor, setEndColor] = useState('#142660');
  const [foreColor, setForeColor] = useState('#fefefe');
  const [linkColor, setLinkColor] = useState('#fe8464');

  useEffect(() => {
    openaiThemes()
      .then(list => setModernThemes((list ?? []).filter(theme => theme.startsWith('modern'))))
      .catch(() => {});
  }, []);

  function buildChatbot() {
    const e = encodeURIComponent;
    let url = backend.url + '/magic/system/openai/include-chatbot.js?' + [
      boolParam('rtl', rtl),
      boolParam('follow_up', followUp),
      boolParam('copyButton', copyButton),
      boolParam('references', references),
      'position=' + e(position),
      'type=' + e(props.type),
      'header=' + e(header),
      'button=' + e(buttonText),
      'placeholder=' + e(placeholder),
      'color=' + e(foreColor),
      'start=' + e(startColor),
      'end=' + e(endColor),
      'link=' + e(linkColor),
      'theme=' + e(modernTheme),
    ].join('&');
    if (animation !== 'none') {
      url += '&animation=' + animation;
    }
    if (sticky) {
      url += '&sticky=true';
    }
    if (history) {
      url += '&history=true';
    }
    if (attachments) {
      url += '&attachments=true';
    }
    return '<script src="' + url + '" defer></' + 'script>';
  }

  const script = buildChatbot();

  return (
    <Modal width={680} onClose={props.onClose}>
      <h2>Embed {props.type}</h2>
      <div style={{ maxHeight: '55vh', overflow: 'auto', paddingRight: 6 }}>
        <div className="form-grid">
            <label>Theme
              <Select value={modernTheme} onChange={value => setModernTheme(value)}>
                {modernThemes.length === 0 && <option value="modern-square">modern-square</option>}
                {modernThemes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </Select>
            </label>
            <label>Header
              <input type="text" value={header} onChange={e => setHeader(e.target.value)} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>Button text
                <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} />
              </label>
              <label>Input placeholder
                <input type="text" value={placeholder} onChange={e => setPlaceholder(e.target.value)} />
              </label>
              <label>Position
                <Select value={position} onChange={value => setPosition(value)}>
                  <option value="right">right</option>
                  <option value="left">left</option>
                </Select>
              </label>
              <label>Animation
                <Select value={animation} onChange={value => setAnimation(value)}>
                  <option value="none">none</option>
                  <option value="scaleUp">scaleUp</option>
                  <option value="slideInBottom">slideInBottom</option>
                  <option value="fadeIn">fadeIn</option>
                </Select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <label style={{ fontSize: 12 }}>Gradient start
                <input type="color" value={startColor} onChange={e => setStartColor(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Gradient end
                <input type="color" value={endColor} onChange={e => setEndColor(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Foreground
                <input type="color" value={foreColor} onChange={e => setForeColor(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Links
                <input type="color" value={linkColor} onChange={e => setLinkColor(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['References', references, setReferences],
                ['Follow-up questions', followUp, setFollowUp],
                ['Copy button', copyButton, setCopyButton],
                ['Right-to-left', rtl, setRtl],
                ['Sticky', sticky, setSticky],
                ['History', history, setHistory],
                ['Attachments', attachments, setAttachments],
              ].map(([label, value, setter]: any) => (
                <label key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={value} onChange={e => setter(e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            Paste this into your website
          </div>
          <pre className="result-json" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {script}
          </pre>
        </div>
      </div>
      <div className="modal-actions">
        <button
          className="btn btn-secondary"
          onClick={() => { copyToClipboard(script, 'The embed script'); setCopied(true); }}>
          {copied ? 'Copied!' : 'Copy embed code'}
        </button>
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * Create/edit model dialog — sends the full old-dashboard payload, with the
 * old defaults for everything not exposed here.
 */
function EditTypeDialog(props: {
  existing: any | null;
  onClose: () => void;
  onSaved: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const existing = props.existing;
  const [models, setModels] = useState<{ id: string }[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [type, setType] = useState(existing?.type ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [temperature, setTemperature] = useState(String(existing?.temperature ?? 0.3));
  const [threshold, setThreshold] = useState(String(existing?.threshold ?? 0.3));
  const [maxTokens, setMaxTokens] = useState(String(existing?.max_tokens ?? 4000));
  const [maxContextTokens, setMaxContextTokens] =
    useState(String(existing?.max_context_tokens ?? 12000));
  const [maxRequestTokens, setMaxRequestTokens] =
    useState(String(existing?.max_request_tokens ?? 1000));
  const [auth, setAuth] = useState<string[]>(existing?.auth ? existing.auth.split(',') : []);
  const [supervised, setSupervised] = useState(existing ? existing.supervised === 1 : true);
  const [useEmbeddings, setUseEmbeddings] =
    useState(existing ? existing.use_embeddings === 1 : true);
  const [cached, setCached] = useState(existing?.cached === 1);
  const [greeting, setGreeting] =
    useState(existing?.greeting ?? 'Hi there, how can I help you?');
  const [systemMessage, setSystemMessage] = useState(existing?.system_message ??
    'You are a helpful assistant, and you will answer the users questions ' +
    'based upon the information found in your context');
  const [dialogTab, setDialogTab] = useState('general');
  const [flavors, setFlavors] = useState<any[]>([]);
  const [completionSlots, setCompletionSlots] = useState<string[]>([]);
  const [largeEditor, setLargeEditor] = useState(false);
  const [dynamicFlavor, setDynamicFlavor] =
    useState<{ instruction: string; template: string } | null>(null);
  // The instruction as loaded — used to flag unsaved changes in the dialog.
  const [addingFunction, setAddingFunction] = useState(false);
  const [initialSystemMessage] = useState(() => systemMessage);
  const instructionChanged = systemMessage !== initialSystemMessage;
  // Twilio, webhooks, lead-gen, questionnaires, prefix and search-postfix
  // are legacy — dropped from the UI and no longer sent.
  const [extra, setExtra] = useState<any>({
    base_url: existing?.base_url ?? '',
    conversation_starters: existing?.conversation_starters ?? '',
    api_key: existing?.api_key ?? '',
    no_requests: existing?.no_requests ?? 0,
    max_requests: existing?.max_requests ?? -1,
    max_function_invocations: existing?.max_function_invocations ?? 5,
    max_session_items: existing?.max_session_items ?? 15,
    completion_slot: existing?.completion_slot ?? 'magic.ai.chat',
    vector_model: existing?.vector_model ?? 'text-embedding-ada-002',
    // A null captcha value ("no captcha") is shown as -1, the sentinel the field
    // maps back to null on save — so the three modes round-trip.
    // Magic's own captcha is the default for new models — 0 in this field.
    recaptcha: existing?.recaptcha ?? 0,
  });

  function setField(key: string, value: any) {
    setExtra((current: any) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    openaiModels()
      .then(list => setModels(list ?? []))
      .catch(() => {});
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
    openaiSystemMessages()
      .then(list => setFlavors(list ?? []))
      .catch(() => {});
    openaiCompletionSlots()
      .then(response => setCompletionSlots(
        Array.isArray(response) ? response : response?.llms ?? []))
      .catch(() => {});
  }, []);

  async function save() {
    if (type.length < 2) {
      props.notify({ text: 'Give the model a type name', isError: true });
      return;
    }
    const payload: any = {
      type,
      model,
      max_context_tokens: Number(maxContextTokens),
      max_request_tokens: Number(maxRequestTokens),
      max_tokens: Number(maxTokens),
      temperature: Number(temperature),
      threshold: Number(threshold),
      supervised: supervised ? 1 : 0,
      auth: auth.length > 0 ? auth.join(',') : null,
      cached: cached ? 1 : 0,
      system_message: systemMessage,
      greeting,
      use_embeddings: useEmbeddings ? 1 : 0,
      ...extra,
      api_key: extra.api_key?.length > 0 ? extra.api_key : null,
      no_requests: Number(extra.no_requests),
      max_requests: Number(extra.max_requests),
      max_function_invocations: Number(extra.max_function_invocations),
      max_session_items: Number(extra.max_session_items),
      // Stored as-is, negatives included — ml_types.recaptcha is NOT NULL, so
      // a negative number is how "no captcha" is persisted, not null.
      recaptcha: Number(extra.recaptcha),
    };
    try {
      if (existing) {
        await mlTypeUpdate(payload);
      } else {
        await mlTypeCreate(payload);
      }
      props.notify({ text: 'Model ' + type + ' saved', isError: false });
      props.onSaved();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  return (
    <Modal width={640} onClose={props.onClose} onSubmit={save}>
      <h2>{existing ? 'Edit ' + existing.type : 'New model'}</h2>
      <Tabs
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'behaviour', label: 'Behaviour' },
          { id: 'integrations', label: 'Integrations' },
        ]}
        active={dialogTab}
        onChange={setDialogTab} />
      <div style={{ maxHeight: '55vh', overflow: 'auto', paddingRight: 6 }}>
        <div className="form-grid" style={{ display: dialogTab === 'general' ? 'flex' : 'none' }}>
          {!existing && (
            <label>Type name
              <input type="text" value={type} onChange={e => setType(e.target.value)} />
            </label>
          )}
          <label>Model
            {/* The models endpoint flags chat-capable models with [chat]; only
                those belong here (the rest are embeddings, audio, realtime,
                etc.), mirroring how Vector model filters on [vector]. The
                current value is kept selectable even if it isn't flagged. */}
            <Select value={model} onChange={value => setModel(value)}>
              <option value="">Select model…</option>
              {model && !models.some(candidate => candidate.id === model && (candidate as any).chat) && (
                <option value={model}>{model}</option>
              )}
              {models.filter(candidate => (candidate as any).chat).map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.id}{modelPriceLabel(candidate as any)}
                </option>
              ))}
            </Select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Temperature
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(e.target.value)} />
            </label>
            {/* Threshold only applies to the embeddings search, so it is dead
                weight when embeddings are off. */}
            <label style={useEmbeddings ? undefined : { opacity: 0.45 }}>Threshold
              <input
                type="number"
                step="0.1"
                value={threshold}
                disabled={!useEmbeddings}
                title={useEmbeddings ? undefined : 'Only used when "Use embeddings" is on'}
                onChange={e => setThreshold(e.target.value)} />
            </label>
            <label>Max tokens
              <input
                type="number"
                value={maxTokens}
                onChange={e => setMaxTokens(e.target.value)} />
            </label>
            {/* Context tokens bound how much retrieved (embedded) material is
                injected, so it too is irrelevant without embeddings. */}
            <label style={useEmbeddings ? undefined : { opacity: 0.45 }}>Max context tokens
              <input
                type="number"
                value={maxContextTokens}
                disabled={!useEmbeddings}
                title={useEmbeddings ? undefined : 'Only used when "Use embeddings" is on'}
                onChange={e => setMaxContextTokens(e.target.value)} />
            </label>
            <label>Max request tokens
              <input
                type="number"
                value={maxRequestTokens}
                onChange={e => setMaxRequestTokens(e.target.value)} />
            </label>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              Authorisation (empty = public)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {roles.map(role => (
                <label
                  key={role}
                  className="chip"
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}>
                  <input
                    type="checkbox"
                    checked={auth.includes(role)}
                    onChange={e => setAuth(e.target.checked
                      ? [...auth, role]
                      : auth.filter(candidate => candidate !== role))} />
                  {role}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={supervised}
                onChange={e => setSupervised(e.target.checked)} />
              Supervised
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={useEmbeddings}
                onChange={e => setUseEmbeddings(e.target.checked)} />
              Use embeddings
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={cached}
                onChange={e => setCached(e.target.checked)} />
              Cached
            </label>
          </div>
          <label>Greeting
            <input type="text" value={greeting} onChange={e => setGreeting(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '12px 16px' }}
            onClick={() => setLargeEditor(true)}>
            ✎ Edit system instruction…
          </button>
          {instructionChanged && (
            <div className="success-box">
              System instruction changed — remember to save your model.
            </div>
          )}
        </div>
        <div className="form-grid" style={{ display: dialogTab === 'behaviour' ? 'flex' : 'none' }}>
          <label>Conversation starters (markdown list)
            <textarea
              rows={4}
              value={extra.conversation_starters}
              onChange={e => setField('conversation_starters', e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Completion slot
              <Select
                value={extra.completion_slot}
                onChange={value => setField('completion_slot', value)}>
                {!completionSlots.includes(extra.completion_slot) && (
                  <option value={extra.completion_slot}>{extra.completion_slot}</option>
                )}
                {completionSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </Select>
            </label>
            <label>Max requests (-1 = unlimited)
              <input
                type="number"
                value={extra.max_requests}
                onChange={e => setField('max_requests', e.target.value)} />
            </label>
            <label>Max function invocations
              <input
                type="number"
                value={extra.max_function_invocations}
                onChange={e => setField('max_function_invocations', e.target.value)} />
            </label>
            <label>Max session items
              <input
                type="number"
                value={extra.max_session_items}
                onChange={e => setField('max_session_items', e.target.value)} />
            </label>
            <label>No requests served
              <input
                type="number"
                value={extra.no_requests}
                onChange={e => setField('no_requests', e.target.value)} />
            </label>
            {/* The single value carries three modes: negative → no captcha,
                0 → Magic's built-in captcha, above 0 → Google reCAPTCHA using
                this as the minimum score. It is persisted exactly as typed —
                ml_types.recaptcha is NOT NULL, so "no captcha" is a negative
                number rather than null. */}
            <label>Captcha (&lt;0 none · 0 Magic · &gt;0 reCAPTCHA score)
              <input
                type="number"
                step="0.1"
                title="Below 0: no captcha. 0: Magic's built-in captcha. Above 0: Google reCAPTCHA, using this as the minimum score (0–1)."
                value={extra.recaptcha}
                onChange={e => setField('recaptcha', e.target.value)} />
            </label>
          </div>
        </div>
        <div className="form-grid" style={{ display: dialogTab === 'integrations' ? 'flex' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* base_url is the site the daily "ainiro-crawl-machine-learning-models"
                task re-crawls to keep the model's training data fresh — not an
                LLM API base. */}
            <label>Auto-crawl URL
              <input
                type="text"
                placeholder="https://example.com"
                title="If set, this site is re-crawled once a day to add new pages to the model"
                value={extra.base_url}
                onChange={e => setField('base_url', e.target.value)} />
            </label>
            <label>API key override
              <input
                type="text"
                className="secret"
                autoComplete="off"
                value={extra.api_key}
                onChange={e => setField('api_key', e.target.value)} />
            </label>
            {/* Only relevant when embeddings are on — it's the model used to
                vectorise the training snippets. */}
            <label style={useEmbeddings ? undefined : { opacity: 0.45 }}>Vector model
              <Select
                value={extra.vector_model}
                disabled={!useEmbeddings}
                onChange={value => setField('vector_model', value)}>
                {!models.some(candidate => candidate.id === extra.vector_model) && (
                  <option value={extra.vector_model}>{extra.vector_model}</option>
                )}
                {models
                  .filter(candidate => (candidate as any).vector)
                  .map(candidate => (
                    <option key={candidate.id} value={candidate.id}>{candidate.id}</option>
                  ))}
              </Select>
            </label>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save}>Save</button>
      </div>
      {largeEditor && (
        <Modal width={1100} onClose={() => setLargeEditor(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, flex: 1 }}>
              System instruction — {type || 'new model'}
            </h2>
            <Select
              value=""
              onChange={value => {
                const flavor = flavors.find(candidate => candidate.name === value);
                if (!flavor?.prefix) {
                  return;
                }
                // Token-budget overrides apply for every flavor.
                if (flavor.max_context_tokens) {
                  setMaxContextTokens(String(flavor.max_context_tokens));
                }
                if (flavor.max_request_tokens) {
                  setMaxRequestTokens(String(flavor.max_request_tokens));
                }
                if (flavor.max_function_invocations) {
                  setField('max_function_invocations', flavor.max_function_invocations);
                }
                // A DYNAMIC "templated template" (contains [[...]] placeholders)
                // is generated from a URL rather than inserted directly.
                if (flavor.name.includes('DYNAMIC') &&
                    flavor.instruction &&
                    flavor.prefix.includes('[[')) {
                  setDynamicFlavor({
                    instruction: flavor.instruction,
                    template: flavor.prefix,
                  });
                  return;
                }
                // Static template: insert the text, substituting the type name.
                let message = flavor.prefix;
                while (message.includes('YOUR_TYPE_NAME_HERE')) {
                  message = message.replace('YOUR_TYPE_NAME_HERE', type || 'default');
                }
                setSystemMessage(message);
              }}>
              <option value="">Apply a template…</option>
              {flavors.map(flavor => (
                <option key={flavor.name} value={flavor.name}>{flavor.name}</option>
              ))}
            </Select>
          </div>
          <div style={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={systemMessage}
              onChange={setSystemMessage}
              mode="markdown" />
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              title="Append an AI function's declaration to the system instruction"
              onClick={() => setAddingFunction(true)}>
              + AI function
            </button>
            <button className="btn" onClick={() => setLargeEditor(false)}>Done</button>
          </div>
          {addingFunction && (
            <AddFunctionDialog
              type={type}
              onClose={() => setAddingFunction(false)}
              onInstalled={() => setAddingFunction(false)}
              onDeclaration={(prompt, completion) => {
                /*
                 * Appended as a markdown section, the way the old edit-type
                 * dialog appends it — heading from the prompt, declaration
                 * underneath, separated from whatever came before.
                 */
                setSystemMessage((current: string) => {
                  const trimmed = current.trimEnd();
                  return (trimmed.length > 0 ? trimmed + '\n\n' : '') +
                    '## ' + prompt + '\n\n' + fenceInvocation(completion);
                });
                setAddingFunction(false);
                showToast('AI function added to your system instruction');
              }}
              notify={props.notify} />
          )}
          {dynamicFlavor && (
            <CreateSystemMessageDialog
              instruction={dynamicFlavor.instruction}
              template={dynamicFlavor.template}
              onGenerated={message => {
                setSystemMessage(message);
                setDynamicFlavor(null);
              }}
              onClose={() => setDynamicFlavor(null)} />
          )}
        </Modal>
      )}
    </Modal>
  );
}


/*
 * Wraps the FUNCTION_INVOCATION block — everything between its two ___
 * markers — in a plaintext fence. A system instruction is markdown, and its
 * own "## Functions" section shows invocations fenced this way, so inserted
 * declarations have to match. Argument descriptions stay outside the fence,
 * since they are prose.
 */
function fenceInvocation(completion: string) {
  const lines = completion.split('\n');
  const opening = lines.indexOf('___');
  if (opening === -1) {
    return completion;
  }
  const closing = lines.indexOf('___', opening + 1);
  if (closing === -1) {
    return completion;
  }
  lines.splice(closing + 1, 0, '```');
  lines.splice(opening, 0, '```plaintext');
  return lines.join('\n');
}

/*
 * "Spice" — scrapes one single page into the model, as opposed to crawling
 * a whole site from the import dialog.
 */
function SpiceDialog(props: {
  type: string;
  onClose: () => void;
  onScrape: (options: {
    url: string; threshold: number; images: boolean; lists: boolean; code: boolean;
  }) => void;
}) {

  const [url, setUrl] = useState('');
  const [threshold, setThreshold] = useState('50');
  const [images, setImages] = useState(true);
  const [lists, setLists] = useState(true);
  const [code, setCode] = useState(true);

  return (
    <Modal
      width={560}
      onClose={props.onClose}
      onSubmit={() => {
        if (url) props.onScrape({ url, threshold: Number(threshold), images, lists, code });
      }}>
      <h2>Spice {props.type}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Scrapes a single web page into this model, without crawling the rest of
        the site.
      </p>
      <div className="form-grid">
        <label>Page URL
          <input
            type="text"
            autoFocus
            placeholder="https://example.com/some-page"
            value={url}
            onChange={e => setUrl(e.target.value)} />
        </label>
        <label>Text threshold
          <input
            type="number"
            min={25}
            title="Minimum character count for content to become a training snippet"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            style={{ width: 140 }} />
        </label>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={images} onChange={e => setImages(e.target.checked)} />
            Import images
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={lists} onChange={e => setLists(e.target.checked)} />
            Import lists
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={code} onChange={e => setCode(e.target.checked)} />
            Import code segments
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button
          className="btn"
          disabled={!url}
          onClick={() => props.onScrape({
            url,
            threshold: Number(threshold),
            images,
            lists,
            code,
          })}>
          Scrape page
        </button>
      </div>
    </Modal>
  );
}

/*
 * Adds an HTML widget to a model — a training snippet whose completion tells
 * the model to render the widget through the render-html-widget workflow.
 */
const WIDGET_WORKFLOW = '/misc/workflows/workflows/machine-learning/render-html-widget.hl';

function AddWidgetDialog(props: {
  type: string;
  onClose: () => void;
  onAdded: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [widgets, setWidgets] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    availableWidgets()
      .then(list => setWidgets(list ?? []))
      .catch(err => setError(err.message));
  }, []);

  async function install(widget: any) {
    const completion = 'If the user asks you to perform an action associated with ' +
      'this function, then responds with the following in the same message:\n' +
      '\n___\nFUNCTION_INVOCATION[' + WIDGET_WORKFLOW + ']:\n{\n  "filename":' +
      widget.file + '\n}\n___';
    try {
      await mlSnippetCreate({
        prompt: 'WRITE YOUR PROMPT HERE',
        completion,
        type: props.type,
        meta: 'FUNCTION_INVOCATION ==> ' + WIDGET_WORKFLOW,
      });
      props.notify({
        text: 'Widget added to ' + props.type + ' — edit its prompt to describe when to use it',
        isError: false,
      });
      props.onAdded();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  const query = filter.toLowerCase();
  const visible = widgets.filter(widget =>
    !query ||
    widget.name?.toLowerCase().includes(query) ||
    widget.description?.toLowerCase().includes(query));

  return (
    <Modal width={720} onClose={props.onClose}>
      <h2>Add widget to {props.type}</h2>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <SearchInput
        placeholder="Filter widgets…"
        value={filter}
        onChange={setFilter}
        style={{ width: '100%', marginBottom: 10 }} />
      <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
        {visible.map(widget => (
          <div
            key={widget.file}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
            <div style={{ flex: 1 }}>
              <strong>{widget.name}</strong>
              {widget.description && <div className="muted">{widget.description}</div>}
            </div>
            <button className="btn btn-secondary btn-small" onClick={() => install(widget)}>
              Add
            </button>
          </div>
        ))}
        {visible.length === 0 && <div className="muted">No widgets available.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * Training data tab.
 */
function TrainingTab(props: {
  types: any[];
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const PAGE_SIZE = 12;
  const [type, setType] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [pickingFunction, setPickingFunction] = useState(false);
  const [pickingWidget, setPickingWidget] = useState(false);
  const [spicing, setSpicing] = useState(false);
  const [scraping, setScraping] = useState<{ channel: string; options: any } | null>(null);
  const [vectorSearch, setVectorSearch] = useState(false);
  const [sort, setSort] = useSort();
  const latestRequest = useRef(0);
  const { confirm, prompt } = useDialog();

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

  const refresh = useCallback(async () => {
    if (!type) {
      return;
    }
    /*
     * Typing fires a request per keystroke, and they don't necessarily come
     * back in order — only the newest one is allowed to paint, otherwise the
     * grid and its count can end up describing an older filter than the one
     * in the box.
     */
    const request = ++latestRequest.current;
    try {
      const [list, total] = await Promise.all([
        mlSnippets(type, filter, page * PAGE_SIZE, PAGE_SIZE, sort, searchingByVector),
        mlSnippetsCount(type, filter, searchingByVector),
      ]);
      if (request !== latestRequest.current) {
        return;
      }
      setSnippets(list ?? []);
      setCount(total.count);
    } catch (err: any) {
      if (request === latestRequest.current) {
        props.notify({ text: err.message, isError: true });
      }
    }
  }, [type, filter, page, sort, searchingByVector]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function remove(snippet: any) {
    if (!await confirm({
      title: 'Delete training snippet?',
      message: snippet.prompt?.substring(0, 100),
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    try {
      await mlSnippetDelete(snippet.id);
      await refresh();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  /*
   * Deletes every snippet the current filter matches, not just the page on
   * screen — so it asks for the count to be typed back.
   */
  async function removeFiltered() {
    const typed = await prompt({
      title: 'Delete all filtered snippets?',
      message: 'This permanently deletes all ' + count + ' snippet(s) matching the ' +
        'current filter in ' + type + '. Type the number to confirm.',
      label: 'Number of snippets',
      confirmText: 'Delete',
    });
    if (typed === null) {
      return;
    }
    if (typed !== String(count)) {
      props.notify({ text: 'Number did not match — nothing deleted', isError: true });
      return;
    }
    try {
      await mlSnippetsDeleteAll(type, filter);
      props.notify({ text: count + ' snippet(s) deleted', isError: false });
      setPage(0);
      await refresh();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  // Scraping runs on a background thread, so it reports over a socket channel.
  async function spice(options: any) {
    setSpicing(false);
    try {
      setScraping({ channel: (await gibberish()).result, options });
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  async function exportSnippets() {
    try {
      const raw = await mlSnippetsExportRaw(type, filter);
      downloadBlob(raw.blob, dispositionFilename(raw.disposition) ?? type + '.csv');
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <div className="toolbar">
        <Select value={type} onChange={value => { setType(value); setPage(0); }}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </Select>
        <SearchInput
          placeholder={vectorSearch ? 'Search meaning…' : 'Filter prompts…'}
          value={filter}
          onChange={value => { setFilter(value); setPage(0); }}
          style={{ width: 240 }} />
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Use vector semantic search to find snippets by meaning rather than by text — only works once you have vectorised this model">
          <input
            type="checkbox"
            checked={vectorSearch}
            onChange={e => { setVectorSearch(e.target.checked); setPage(0); }} />
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
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
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
                <td data-label="Embedded">{snippet.embedding_vss ? 'yes' : 'no'}</td>
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
          </tbody>
        </table>
        {pageCount > 1 && (
          <div className="pagination" style={{ padding: 12 }}>
            <button
              className="btn btn-secondary btn-small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}>
              ‹ Prev
            </button>
            <span className="muted">{page + 1} / {pageCount}</span>
            <button
              className="btn btn-secondary btn-small"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}>
              Next ›
            </button>
          </div>
        )}
      </div>
      {editing !== null && (
        <EditSnippetDialog
          type={type}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
          notify={props.notify} />
      )}
      {pickingFunction && (
        <AddFunctionDialog
          type={type}
          onClose={() => setPickingFunction(false)}
          onInstalled={() => { setPickingFunction(false); refresh(); }}
          notify={props.notify} />
      )}
      {pickingWidget && (
        <AddWidgetDialog
          type={type}
          onClose={() => setPickingWidget(false)}
          onAdded={() => { setPickingWidget(false); refresh(); }}
          notify={props.notify} />
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
              .catch(err => props.notify({ text: err.message, isError: true }));
          }}
          onClose={() => { setScraping(null); refresh(); }} />
      )}
    </>
  );
}

function EditSnippetDialog(props: {
  type: string;
  existing: any | null;
  onClose: () => void;
  onSaved: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [prompt, setPrompt] = useState(props.existing?.prompt ?? '');
  const [completion, setCompletion] = useState(props.existing?.completion ?? '');

  /*
   * System message forcing the model to hand back a clean {prompt, completion}
   * JSON object, so an instruction like "remove all redundant facts" can rewrite
   * a messy snippet (e.g. one pasted out of a PDF) in place. It replaces the
   * type's own system message via [system_message_override], and the existing
   * snippet is embedded here so the model has the material to transform.
   */
  const transformInstruction = () =>
    'You are a data-cleaning assistant for a machine-learning training set. You are ' +
    'given an existing training snippet and, in the user message, an instruction ' +
    'describing how to transform it. Apply the instruction, then respond with ONLY a ' +
    'raw JSON object containing exactly two string fields:\n' +
    '  "prompt": a single sentence, with no carriage returns, summarising the completion.\n' +
    '  "completion": the transformed content.\n' +
    'Do not wrap the JSON in markdown fences, and add no commentary before or after it.\n\n' +
    '--- EXISTING SNIPPET ---\n' +
    'Prompt: ' + prompt + '\n' +
    'Completion:\n' + completion;

  /*
   * The model is asked for raw JSON, but tolerate fences and stray prose: pull the
   * first {...} block, parse it, and on any failure just drop the whole answer into
   * the completion so nothing the model produced is lost.
   */
  function applyTransform(result: string) {
    const match = result.match(/\{[\s\S]*\}/);
    try {
      const parsed = JSON.parse(match ? match[0] : result);
      if (typeof parsed.prompt === 'string') setPrompt(parsed.prompt);
      if (typeof parsed.completion === 'string') setCompletion(parsed.completion);
      if (typeof parsed.prompt !== 'string' && typeof parsed.completion !== 'string') {
        setCompletion(result);
      }
    } catch {
      setCompletion(result);
    }
  }

  async function save() {
    try {
      if (props.existing) {
        await mlSnippetUpdate({
          id: props.existing.id,
          prompt,
          completion,
          type: props.type,
        });
      } else {
        await mlSnippetCreate({ prompt, completion, type: props.type, meta: null, uri: null });
      }
      props.notify({ text: 'Snippet saved', isError: false });
      props.onSaved();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  return (
    <Modal width={820} onClose={props.onClose} onSubmit={() => { if (prompt) save(); }}>
      <h2>{props.existing ? 'Edit snippet' : 'New snippet'}</h2>
      <div className="form-grid">
        <label>Prompt
          <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} />
        </label>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Completion</div>
          <div style={{ height: '38vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor value={completion} onChange={setCompletion} mode="markdown" />
          </div>
          {/*
            * Ask the Machine to transform the snippet — the typed instruction is
            * the user message, the current snippet + JSON contract is the system
            * override, and the returned {prompt, completion} is written back in.
            */}
          <AiPrompt
            fileType={props.type}
            getContext={transformInstruction}
            session={'ml-snippet-transform.' + props.type}
            onResult={applyTransform}
            onError={message => props.notify({ text: message, isError: true })}
            style={{ marginTop: 8 }} />
        </div>
      </div>
      <div className="modal-actions">
        {props.existing?.meta && (
          <span className="snippet-meta">{props.existing.meta}</span>
        )}
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={!prompt}>Save</button>
      </div>
    </Modal>
  );
}

/*
 * "Create AI function" — lists installable functions, generates the
 * declaration for one, and saves it as a training snippet.
 */
function AddFunctionDialog(props: {
  type: string;
  onClose: () => void;
  onInstalled: () => void;
  /*
   * When given, the declaration is handed back rather than written as a
   * training snippet — how a function gets added to a system instruction.
   */
  onDeclaration?: (prompt: string, completion: string) => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    availableWorkflows()
      .then(list => setWorkflows(list ?? []))
      .catch(err => setError(err.message));
  }, []);

  async function install(workflow: any) {
    try {
      let declaration = await getFunctionDeclaration(workflow.file);
      if (!declaration) {
        props.notify({
          text: workflow.name + ' has no [.arguments] collection, so it cannot ' +
            'be invoked as an AI function',
          isError: true,
        });
        return;
      }
      while (declaration.includes('YOUR_TYPE_NAME_HERE')) {
        declaration = declaration.replace('YOUR_TYPE_NAME_HERE', props.type);
      }
      const lines = declaration.split('\n');
      const prompt = lines[0].trim();
      const completion = lines.slice(1).join('\n').trim();
      if (props.onDeclaration) {
        props.onDeclaration(prompt, completion);
        return;
      }
      await mlSnippetCreate({
        prompt,
        completion,
        type: props.type,
        meta: 'FUNCTION_INVOCATION ==> ' + workflow.file,
        uri: null,
      });
      props.notify({
        text: 'AI function ' + workflow.name + ' added to ' + props.type,
        isError: false,
      });
      props.onInstalled();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  const visible = workflows.filter(workflow =>
    !filter ||
    workflow.name?.toLowerCase().includes(filter.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Modal width={720} onClose={props.onClose}>
      <h2>Add AI function to {props.type}</h2>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <SearchInput
        placeholder="Filter functions…"
        value={filter}
        onChange={setFilter}
        style={{ width: '100%', marginBottom: 10 }} />
      <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
        {visible.map(workflow => (
          <div
            key={workflow.file}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 4px',
              borderBottom: '1px solid var(--border)',
            }}>
            <div style={{ flex: 1 }}>
              <div><strong>{workflow.name}</strong></div>
              <div className="muted" style={{ fontSize: 13 }}>{workflow.description}</div>
              <div className="mono muted" style={{ fontSize: 11 }}>{workflow.file}</div>
            </div>
            <button className="btn btn-secondary btn-small" onClick={() => install(workflow)}>
              Install
            </button>
          </div>
        ))}
        {visible.length === 0 && <div className="muted">No functions found.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * History tab — requests towards your models.
 */
function HistoryTab(props: {
  types: any[];
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const PAGE_SIZE = 15;
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [requests, setRequests] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!type && props.types.length > 0) {
      setType(props.types[0].type);
    }
  }, [props.types, type]);

  useEffect(() => {
    if (!type) {
      return;
    }
    mlRequests(type, page * PAGE_SIZE, PAGE_SIZE)
      .then(list => setRequests(list ?? []))
      .catch(err => props.notify({ text: err.message, isError: true }));
  }, [type, page]);

  return (
    <>
      <div className="toolbar">
        <Select value={type} onChange={value => { setType(value); setPage(0); }}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </Select>
        <span className="spacer" />
        <button
          className="btn btn-secondary btn-small"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}>
          ‹ Newer
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={requests.length < PAGE_SIZE}
          onClick={() => setPage(page + 1)}>
          Older ›
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 170 }}>When</th>
              <th>Prompt</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <RequestRow
                key={request.id}
                request={request}
                expanded={expanded === request.id}
                onToggle={() => setExpanded(expanded === request.id ? null : request.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/*
 * Conversation content is whatever a visitor typed into the chatbot, and the
 * backend stores and returns it verbatim — it does not HTML encode. It is
 * therefore rendered as JSX text, which React escapes, so markup arrives on
 * screen as visible characters and never as live HTML. Never render any of
 * these values through dangerouslySetInnerHTML.
 */
function RequestRow(props: { request: any; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="clickable" onClick={props.onToggle}>
        <td className="mono" data-label="When">{new Date(props.request.created).toLocaleString()}</td>
        <td data-label="Prompt" style={{
          maxWidth: 620,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {props.request.prompt}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={2}>
            <pre className="result-json" style={{ whiteSpace: 'pre-wrap' }}>
              {props.request.completion}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
