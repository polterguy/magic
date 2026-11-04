import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  backendInfo,
  createBot,
  modelPriceLabel,
  type OpenAiModel,
  openaiModels,
  openaiSystemMessages,
  type SystemMessage,
} from '../../lib/api';
import { withoutTrailingSlashes } from '../../lib/backend';
import { showError } from '../../lib/errors';
import Select from '../Select';
import SocketFeedback from '../SocketFeedback';
import { chatbotModelFromProgress, DEFAULT_BOT_MODEL } from './constants';

/*
 * The chatbot wizard, as one card: point it at a website, pick a model and a
 * persona, and the backend crawls the site and builds a machine learning
 * model from what it finds.
 *
 * The crawl takes minutes and reports progress over a socket channel, so the
 * feedback window opens BEFORE the endpoint is invoked - the socket has to be
 * listening or the first messages are lost. Closing it only stops watching;
 * the crawl carries on regardless.
 */
export default function CreateChatbot(props: Readonly<{ onTour: () => void }>) {
  const [url, setUrl] = useState('');
  const [model, setModel] = useState(DEFAULT_BOT_MODEL);
  // The chat models the backend's catalogue lists, newest first, with their pricing.
  const [models, setModels] = useState<OpenAiModel[]>([]);
  const [flavors, setFlavors] = useState<SystemMessage[]>([]);
  const [flavor, setFlavor] = useState('');
  const [max, setMax] = useState('25');
  const [autoDestruct, setAutoDestruct] = useState(true);
  const [crawl, setCrawl] = useState<{ channel: string } | null>(null);

  /*
   * The models come from a static catalogue, so they load with the form since
   * the dropdown has nothing to show without them. The personas only matter to
   * somebody actually filling this in, so they're fetched on the first touch of the form
   * rather than on every dashboard visit. Focus reaches here from any
   * field, including the dropdowns, so whichever one is used first pays
   * for it - and only once.
   */
  useEffect(() => {
    openaiModels()
      .then(list => setModels((list ?? []).filter(candidate => candidate.chat)))
      .catch(() => {});
  }, []);

  const loaded = useRef(false);
  function loadOptions() {
    if (loaded.current) {
      return;
    }
    loaded.current = true;
    openaiSystemMessages()
      .then(list => {
        setFlavors(list ?? []);
        setFlavor((list ?? [])[0]?.name ?? '');
      })
      .catch(() => {});
  }

  const selected = flavors.find(candidate => candidate.name === flavor);

  return (
    /*
     * Same action-card chrome as its dashboard siblings — the inner wrapper
     * is the card's single flex child, so the form keeps its block layout.
     */
    <div className="card agent-prompt" data-tour="chatbot-wizard">
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ marginTop: 0 }}>Chatbot Wizard</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Crawls the site, turns what it finds into training data, and gives you a chatbot you can
          embed. Takes a few minutes.{' '}
          <button type="button" className="link-btn" onClick={props.onTour}>
            What do these fields do?
          </button>
        </p>
        <form
          onFocus={loadOptions}
          onSubmit={e => {
            e.preventDefault();
            if (url.trim() && !crawl) {
              setCrawl({ channel: 'create-bot-' + Date.now() });
            }
          }}
        >
          <div className="form-grid columns">
            <label data-tour="chatbot-url">
              Website URL{' '}
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </label>
            <label data-tour="chatbot-model">
              OpenAI model
              <Select value={model} onChange={value => setModel(value)}>
                {models.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.id}
                    {modelPriceLabel(candidate)}
                  </option>
                ))}
              </Select>
            </label>
            <label data-tour="chatbot-persona">
              Persona
              <Select value={flavor} onChange={value => setFlavor(value)}>
                {flavors.map(candidate => (
                  <option key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
              </Select>
            </label>
            <label data-tour="chatbot-pages">
              Max pages{' '}
              <input type="number" min="1" value={max} onChange={e => setMax(e.target.value)} />
            </label>
          </div>
          {/*
           * Below the captioned fields rather than inside them. A checkbox and
           * a button have no caption, so sitting them in that grid meant
           * faking one and forcing the height to match an input.
           */}
          <div className="form-row" data-tour="chatbot-create">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={autoDestruct}
                onChange={e => setAutoDestruct(e.target.checked)}
              />{' '}
              Delete after 7 days
            </label>
            {/* Submits the form, so Enter in any field starts the crawl too. */}
            <button className="btn" type="submit" disabled={!url.trim() || !!crawl}>
              Create chatbot
            </button>
          </div>
        </form>
        {selected?.description && (
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
            {selected.description}
          </p>
        )}
        {crawl && (
          <SocketFeedback
            title={'Creating a chatbot from ' + url}
            channel={crawl.channel}
            onReady={() => {
              createBot({
                url: url.trim(),
                model,
                // The persona's template, and the instruction that has OpenAI
                // fill its placeholders from the crawled site.
                flavor: selected?.prefix ?? '',
                instruction: selected?.instruction ?? '',
                max: Number(max) || 25,
                autoDestruct,
                channel: crawl.channel,
              }).catch((err: unknown) => showError(err));
            }}
            isComplete={message => message.message.trim() === 'Done!'}
            renderDone={messages => {
              // The landing page's name, announced in the progress messages.
              const text = messages.map(m => m.message).join('\n');
              const model = chatbotModelFromProgress(text);
              if (!model) {
                return null;
              }
              const href = withoutTrailingSlashes(backendInfo().url) + '/' + model;
              /*
               * Seeing the result comes before tuning it, so opening the chatbot
               * leads. Editing is offered next to it because everything the
               * wizard chose - persona, greeting, temperature, thresholds - is a
               * default, and the model page is not somewhere you would think to
               * look for a chatbot you just made.
               */
              return (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a className="btn" href={href} target="_blank" rel="noopener noreferrer">
                    Open chatbot ↗
                  </a>
                  <Link
                    className="btn btn-secondary"
                    to={'/machine-learning?edit=' + encodeURIComponent(model)}
                  >
                    Edit model
                  </Link>
                </div>
              );
            }}
            onClose={() => setCrawl(null)}
          />
        )}
      </div>
    </div>
  );
}
