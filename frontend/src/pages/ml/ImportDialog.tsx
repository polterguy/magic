/*
 * Import dialog — crawl a website (progress over the socket), or upload
 * training files.
 */

import { useState } from 'react';
import { Modal } from '../../components/Dialogs';
import Select from '../../components/Select';
import SocketFeedback from '../../components/SocketFeedback';
import Tabs from '../../components/Tabs';
import {
  gibberish,
  importUrl,
  uploadCsvFile,
  uploadImageFile,
  uploadTrainingFile,
  uploadUrlList,
} from '../../lib/api';
import { showToast } from '../../lib/toast';

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

export default function ImportDialog(props: {
  type: string;
  onClose: () => void;
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
    // The uploading guard doubles as a re-entry lock — a second click while
    // the channel is being created would discard the first crawl's terminal.
    if (!url || uploading) {
      return;
    }
    setUploading(true);
    try {
      const channel = (await gibberish()).result;
      setCrawling(channel);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setUploading(false);
    }
  }

  async function upload(files: File[]) {
    /*
     * A URL list is scraped asynchronously with progress over the socket,
     * so it takes the feedback-channel route rather than a plain upload.
     */
    if (category === 'urls') {
      setUploading(true);
      try {
        setUrlListFile(files[0]);
        setScraping((await gibberish()).result);
      } catch (err: any) {
        showToast(err.message, true);
      } finally {
        setUploading(false);
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
      showToast(count + ' ' + noun);
      props.onClose();
    } catch (err: any) {
      showToast(err.message, true);
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
              <button className="btn" onClick={crawl} disabled={!url || uploading}>
                {uploading ? 'Starting…' : 'Start crawling'}
              </button>
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
            }).catch(err => showToast(err.message, true));
          }}
          onClose={() => { setCrawling(null); props.onClose(); }} />
      )}
      {scraping && urlListFile && (
        <SocketFeedback
          title={'Scraping URLs from ' + urlListFile.name}
          channel={scraping}
          onReady={() => {
            uploadUrlList(props.type, urlListFile, scraping, urlListVectorize)
              .catch(err => showToast(err.message, true));
          }}
          onClose={() => { setScraping(null); props.onClose(); }} />
      )}
    </>
  );
}
