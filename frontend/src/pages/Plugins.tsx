import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';

import BusyLabel from '../components/BusyLabel';
import { Modal } from '../components/Dialogs';
import SearchInput from '../components/SearchInput';
import { CardGridSkeleton } from '../components/Skeleton';
import {
  availablePlugins,
  BazarApp,
  installedPlugins,
  installModule,
  installPlugin,
  moduleNameFromZip,
} from '../lib/api';
import { showError } from '../lib/errors';
import { showToast } from '../lib/toast';
import { useDialog } from '../lib/useDialog';

/*
 * Descriptions come from the Bazar's manifests, which are markdown, so they
 * have to be rendered as HTML rather than escaped as text — which makes them
 * the one place in the dashboard where remote content reaches the DOM as
 * markup. Markdown permits raw HTML, so a manifest can carry a script tag or
 * an onerror attribute, and every description is put through this first.
 */
function safeHtml(description: string | undefined) {
  return DOMPurify.sanitize(marked.parse(description ?? '') as string);
}

// Card intro: render the markdown description, extract its plain text, and
// show the first sentence, capped at 150 characters.
function intro(description: string | undefined) {
  /*
   * Parsed into an inert document rather than assigned to an element's
   * innerHTML: an inert document neither runs scripts nor fetches anything,
   * so an <img onerror> can't fire while we're only after the text.
   */
  const parsed = new DOMParser().parseFromString(safeHtml(description), 'text/html');
  const text = (parsed.body.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
  const period = text.indexOf('.');
  const sentence = period === -1 ? text : text.slice(0, period + 1);
  return sentence.length > 150 ? sentence.slice(0, 150) + '…' : sentence;
}

function installLabel(installing: boolean, installed: boolean) {
  if (installing) {
    return 'Installing…';
  }
  return installed ? 'Reinstall' : 'Install';
}

type Kind = 'all' | 'module' | 'frontend' | 'installed';

const FILTERS: { key: Kind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'module', label: 'Modules' },
  { key: 'frontend', label: 'Frontends' },
  { key: 'installed', label: 'Installed' },
];

const SECTIONS: { key: 'module' | 'frontend'; title: string; hint: string }[] = [
  { key: 'module', title: 'Modules', hint: 'Backend code installed into its own module folder' },
  { key: 'frontend', title: 'Frontends', hint: 'Served from your cloudlet’s root URL' },
];

// Anything the Bazar doesn't call a frontend installs as a module.
function sectionOf(app: BazarApp): 'module' | 'frontend' {
  return app.type === 'frontend' ? 'frontend' : 'module';
}

export default function Plugins() {
  const [available, setAvailable] = useState<BazarApp[]>([]);
  // The Bazar listing is a slow remote call, so we show a spinner until it lands.
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [installing, setInstalling] = useState<string | null>(null);
  const [details, setDetails] = useState<BazarApp | null>(null);
  const [uploading, setUploading] = useState(false);
  const { confirm } = useDialog();

  useEffect(() => {
    availablePlugins()
      .then(list => setAvailable(list ?? []))
      .catch((err: unknown) => showError(err))
      .finally(() => setLoading(false));
    installedPlugins()
      // A manifest's module_name is the folder it installed into, which is
      // what the Bazar calls the plugin — its name is a friendlier label.
      .then(list => setInstalled(new Set((list ?? []).flatMap(app => app.module_name ?? []))))
      .catch(() => {});
  }, []);

  // Matching the search box, before the kind filter, so every filter button can count its share.
  const matching = useMemo(() => {
    const query = filter.toLowerCase();
    return available.filter(
      app =>
        !query ||
        app.name?.toLowerCase().includes(query) ||
        app.type?.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query),
    );
  }, [available, filter]);

  const counts: Record<Kind, number> = {
    all: matching.length,
    module: matching.filter(app => sectionOf(app) === 'module').length,
    frontend: matching.filter(app => sectionOf(app) === 'frontend').length,
    installed: matching.filter(app => installed.has(app.name)).length,
  };

  const visible = matching.filter(app => {
    if (kind === 'installed') {
      return installed.has(app.name);
    }
    return kind === 'all' || sectionOf(app) === kind;
  });

  /*
   * A module of your own, as a ZIP, rather than one from the Bazar. Same
   * endpoint Hyper IDE uses — the archive's name becomes the module folder,
   * so an existing module of that name is overwritten.
   */
  async function installFromFile(file: File) {
    const name = moduleNameFromZip(file);
    if (!name) {
      showToast(
        file.name +
          ' cannot be a module — the archive must be named ' +
          '<name>.zip, using only lowercase letters, digits, hyphens or ' +
          'underscores, and no further dots',
        true,
      );
      return;
    }
    if (
      installed.has(name) &&
      !(await confirm({
        title: 'Overwrite ' + name + '?',
        message:
          'A module called ' +
          name +
          ' is already installed. Installing ' +
          'this archive replaces its files.',
        confirmText: 'Yes, overwrite',
        danger: true,
      }))
    ) {
      return;
    }
    setUploading(true);
    try {
      await installModule(file);
      showToast('Module ' + name + ' installed');
      const list = await installedPlugins();
      setInstalled(new Set((list ?? []).flatMap(app => app.module_name ?? [])));
    } catch (err) {
      showError(err);
    } finally {
      setUploading(false);
    }
  }

  async function install(app: BazarApp) {
    const again = installed.has(app.name);
    if (
      app.type === 'frontend' &&
      !(await confirm({
        title: 'Confirm installation',
        message:
          'This overwrites all existing frontend files in your /etc/www/ folder. Are you sure?',
        confirmText: 'Yes, install',
        danger: true,
      }))
    ) {
      return;
    }
    /*
     * Reinstalling is how a plugin is updated, so it stays available — but
     * it overwrites the module's files, which takes any local edits with it.
     */
    if (
      again &&
      app.type !== 'frontend' &&
      !(await confirm({
        title: 'Reinstall ' + app.name + '?',
        message:
          'This overwrites the files in the module with the plugin ' +
          "repository's current version. Any changes you have made to them are lost.",
        confirmText: 'Yes, reinstall',
        danger: true,
      }))
    ) {
      return;
    }
    setInstalling(app.name);
    try {
      await installPlugin(app);
      showToast(app.name + ' is installing — you will be notified when it completes');
      setInstalled(current => new Set(current).add(app.name));
    } catch (err) {
      showError(err);
    } finally {
      setInstalling(null);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="page-title">
          <h1>Plugins</h1>
          <p>Install plugins from the plugin repository, or your own module from a ZIP file</p>
        </div>
        <div className="page-tools">
          <label className={'btn btn-secondary' + (uploading ? ' disabled' : '')}>
            <BusyLabel busy={uploading} label="Install from file…" busyLabel="Installing…" />
            <input
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={e => {
                const file = e.target.files?.[0];
                // Cleared so picking the same archive twice fires again.
                e.target.value = '';
                if (file) {
                  void installFromFile(file);
                }
              }}
            />
          </label>
          <SearchInput
            placeholder="Search plugins…"
            value={filter}
            onChange={setFilter}
            style={{ width: 300 }}
          />
          <span className="muted">{visible.length} shown</span>
        </div>
      </div>
      <fieldset className="plugin-filters" aria-label="Show plugins">
        {FILTERS.map(option => (
          <button
            key={option.key}
            className={'plugin-filter' + (kind === option.key ? ' active' : '')}
            aria-pressed={kind === option.key}
            onClick={() => setKind(option.key)}
          >
            {option.label}
            <span className="plugin-filter-count">{counts[option.key]}</span>
          </button>
        ))}
      </fieldset>
      {loading && <CardGridSkeleton />}
      {!loading && visible.length === 0 && (
        <div className="info-box">
          {filter ? 'No plugins match “' + filter + '”.' : 'No plugins to show here.'}
        </div>
      )}
      {!loading &&
        SECTIONS.map(section => {
          const apps = visible.filter(app => sectionOf(app) === section.key);
          if (apps.length === 0) {
            return null;
          }
          return (
            <section key={section.key} className="plugin-section">
              <div className="dash-section-head">
                <h2>{section.title}</h2>
                <span className="dash-count">{apps.length}</span>
                <span className="plugin-section-hint muted">{section.hint}</span>
              </div>
              <div className="plugin-grid">
                {apps.map(app => (
                  <PluginCard
                    key={app.name}
                    app={app}
                    installed={installed.has(app.name)}
                    installing={installing === app.name}
                    onDetails={() => setDetails(app)}
                    onInstall={() => install(app)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      {details && (
        <Modal width={700} onClose={() => setDetails(null)}>
          <h2>{details.name}</h2>
          <div
            className="markdown-body"
            style={{ maxHeight: '60vh', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: safeHtml(details.description) }}
          />
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDetails(null)}>
              Close
            </button>
            <button
              className="btn"
              onClick={() => {
                const app = details;
                setDetails(null);
                void install(app);
              }}
            >
              {installed.has(details.name) ? 'Reinstall' : 'Install'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// One plugin: its initial, name and install state, the first sentence of its description, and its actions.
function PluginCard(
  props: Readonly<{
    app: BazarApp;
    installed: boolean;
    installing: boolean;
    onDetails: () => void;
    onInstall: () => void;
  }>,
) {
  const { app } = props;
  return (
    <div className={'card plugin-card' + (props.installed ? ' plugin-card-installed' : '')}>
      <div className="plugin-card-head">
        <span className="plugin-card-icon mono" aria-hidden="true">
          {(app.name?.[0] ?? '?').toUpperCase()}
        </span>
        <strong className="plugin-card-name mono">{app.name}</strong>
        {props.installed && (
          <span className="dash-status dash-status-ok">
            <span className="dash-status-dot" />
            {'Installed'}
          </span>
        )}
      </div>
      <p className="plugin-card-text line-clamp">{intro(app.description)}</p>
      <div className="plugin-card-actions">
        <button className="btn btn-ghost btn-small" onClick={props.onDetails}>
          Details
        </button>
        <button
          className={'btn btn-small' + (props.installed ? ' btn-secondary' : '')}
          disabled={props.installing}
          title={
            props.installed
              ? "Install the plugin repository's current version over the one you have"
              : undefined
          }
          onClick={props.onInstall}
        >
          {installLabel(props.installing, props.installed)}
        </button>
      </div>
    </div>
  );
}
