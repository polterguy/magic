import Banner from '../components/Banner';
import { useCallback, useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { Modal, useDialog } from '../components/Dialogs';
import SocketFeedback from '../components/SocketFeedback';
import CreateSystemMessageDialog from '../components/CreateSystemMessageDialog';
import Tabs from '../components/Tabs';
import SortHeader, { SortState, useSort } from '../components/SortHeader';
import {
  availableWorkflows,
  backendInfo,
  getFunctionDeclaration,
  gibberish,
  importUrl,
  listRoles,
  mlRequests,
  mlSnippetCreate,
  mlSnippetDelete,
  mlSnippets,
  mlSnippetsCount,
  mlSnippetUpdate,
  mlTypeCreate,
  mlTypeDelete,
  mlTypes,
  mlTypeUpdate,
  openaiCompletionSlots,
  openaiIsConfigured,
  openaiModels,
  openaiSystemMessages,
  openaiThemes,
  uploadCsvFile,
  uploadImageFile,
  uploadUrlList,
  uploadTrainingFile,
  vectoriseType,
} from '../lib/api';

type Tab = 'types' | 'training' | 'history';

export default function MachineLearning() {

  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [configured, setConfigured] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

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
      {feedback && (
        <Banner
          isError={feedback.isError}
          onClose={() => setFeedback(null)}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </Banner>
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
  const [vectorising, setVectorising] = useState<{ type: string; channel: string } | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<string | null>(null);
  const { prompt } = useDialog();

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
      const channel = (await gibberish()).result;
      setVectorising({ type, channel });
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
                <td className="mono">{type.model}</td>
                <td>{type.use_embeddings ? 'yes' : 'no'}</td>
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
      <Modal width={620} onClose={props.onClose}>
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
              <select
                value={category}
                onChange={e => setCategory(e.target.value as keyof typeof UPLOAD_CATEGORIES)}>
                {Object.entries(UPLOAD_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
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
              <select value={modernTheme} onChange={e => setModernTheme(e.target.value)}>
                {modernThemes.length === 0 && <option value="modern-square">modern-square</option>}
                {modernThemes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
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
                <select value={position} onChange={e => setPosition(e.target.value)}>
                  <option value="right">right</option>
                  <option value="left">left</option>
                </select>
              </label>
              <label>Animation
                <select value={animation} onChange={e => setAnimation(e.target.value)}>
                  <option value="none">none</option>
                  <option value="scaleUp">scaleUp</option>
                  <option value="slideInBottom">slideInBottom</option>
                  <option value="fadeIn">fadeIn</option>
                </select>
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
          onClick={() => { navigator.clipboard.writeText(script); setCopied(true); }}>
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
        Array.isArray(response) ? response : response?.slots ?? []))
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
    <Modal width={640} onClose={props.onClose}>
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
            <select value={model} onChange={e => setModel(e.target.value)}>
              <option value="">Select model…</option>
              {model && !models.some(candidate => candidate.id === model) && (
                <option value={model}>{model}</option>
              )}
              {models.map(candidate => (
                <option key={candidate.id} value={candidate.id}>{candidate.id}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Temperature
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(e.target.value)} />
            </label>
            <label>Threshold
              <input
                type="number"
                step="0.1"
                value={threshold}
                onChange={e => setThreshold(e.target.value)} />
            </label>
            <label>Max tokens
              <input
                type="number"
                value={maxTokens}
                onChange={e => setMaxTokens(e.target.value)} />
            </label>
            <label>Max context tokens
              <input
                type="number"
                value={maxContextTokens}
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
              <select
                value={extra.completion_slot}
                onChange={e => setField('completion_slot', e.target.value)}>
                {!completionSlots.includes(extra.completion_slot) && (
                  <option value={extra.completion_slot}>{extra.completion_slot}</option>
                )}
                {completionSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
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
            <label>reCAPTCHA threshold (0 = off)
              <input
                type="number"
                step="0.1"
                value={extra.recaptcha}
                onChange={e => setField('recaptcha', e.target.value)} />
            </label>
          </div>
        </div>
        <div className="form-grid" style={{ display: dialogTab === 'integrations' ? 'flex' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Base URL (alternative API)
              <input
                type="text"
                value={extra.base_url}
                onChange={e => setField('base_url', e.target.value)} />
            </label>
            <label>API key override
              <input
                type="password"
                value={extra.api_key}
                onChange={e => setField('api_key', e.target.value)} />
            </label>
            <label>Vector model
              <select
                value={extra.vector_model}
                onChange={e => setField('vector_model', e.target.value)}>
                {!models.some(candidate => candidate.id === extra.vector_model) && (
                  <option value={extra.vector_model}>{extra.vector_model}</option>
                )}
                {models
                  .filter(candidate => (candidate as any).vector)
                  .map(candidate => (
                    <option key={candidate.id} value={candidate.id}>{candidate.id}</option>
                  ))}
              </select>
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
            <select
              value=""
              onChange={e => {
                const flavor = flavors.find(candidate => candidate.name === e.target.value);
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
            </select>
          </div>
          <div style={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={systemMessage}
              onChange={setSystemMessage}
              mode="markdown" />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setLargeEditor(false)}>Done</button>
          </div>
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
  const [sort, setSort] = useSort();
  const { confirm } = useDialog();

  useEffect(() => {
    if (!type && props.types.length > 0) {
      setType(props.types[0].type);
    }
  }, [props.types, type]);

  const refresh = useCallback(async () => {
    if (!type) {
      return;
    }
    try {
      const [list, total] = await Promise.all([
        mlSnippets(type, filter, page * PAGE_SIZE, PAGE_SIZE, sort),
        mlSnippetsCount(type, filter),
      ]);
      setSnippets(list ?? []);
      setCount(total.count);
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }, [type, filter, page, sort]);

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

  const pageCount = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <div className="toolbar">
        <select value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter prompts…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          style={{ width: 240 }} />
        <span className="muted">{count} snippets</span>
        <span className="spacer" />
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
              <th style={{ width: 110 }}>Embedded</th>
              <th style={{ width: 150 }}></th>
            </tr>
          </thead>
          <tbody>
            {snippets.map(snippet => (
              <tr key={snippet.id}>
                <td style={{
                  maxWidth: 520,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {snippet.prompt}
                </td>
                <td>{snippet.tokens}</td>
                <td>{snippet.embedding_vss ? 'yes' : 'no'}</td>
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
    <Modal width={820} onClose={props.onClose}>
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
        </div>
      </div>
      <div className="modal-actions">
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
      await mlSnippetCreate({
        prompt: lines[0].trim(),
        completion: lines.slice(1).join('\n').trim(),
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
      <input
        type="text"
        placeholder="Filter functions…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
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
        <select value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </select>
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

function RequestRow(props: { request: any; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="clickable" onClick={props.onToggle}>
        <td className="mono">{new Date(props.request.created).toLocaleString()}</td>
        <td style={{
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
