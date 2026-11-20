import { useState } from 'react';

import { Modal } from '../Dialogs';
import { asObject, configSection, JsonObject, parseObject, settingText } from './json';

/*
 * Patches magic.git.github in the configuration — the credentials Hyper IDE's
 * Git support authenticates with towards GitHub.
 */
export default function GitDialog(
  props: Readonly<{
    config: string;
    onClose: () => void;
    onSave: (config: string) => void;
  }>,
) {
  const existing = configSection(props.config, 'magic', 'git', 'github');

  const [username, setUsername] = useState(settingText(existing.username));
  const [token, setToken] = useState(settingText(existing.token));
  const [host, setHost] = useState(settingText(existing.host, 'github.com'));
  const [apiBase, setApiBase] = useState(settingText(existing['api-base']));

  function save() {
    const parsed = parseObject(props.config);
    if (!parsed) {
      return;
    }
    const magic = asObject(parsed.magic);
    parsed.magic = magic;
    const git = asObject(magic.git);
    magic.git = git;
    const github: JsonObject = { username, token, host };
    if (apiBase) {
      github['api-base'] = apiBase;
    }
    git.github = github;
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal
      size="md"
      onClose={props.onClose}
      onSubmit={save}
      title="Git settings"
      subtitle={
        <>
          GitHub credentials for Hyper IDE&apos;s Git support. Create a{' '}
          <a
            href="https://github.com/settings/personal-access-tokens"
            target="_blank"
            rel="noreferrer"
          >
            fine-grained personal access token
          </a>{' '}
          with <em>Contents</em> read and write access to the repositories your cloudlet manages.
          The token only authenticates transport — commits are authored as the signed-in user&apos;s
          profile name and email.
        </>
      }
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="form-cols-2">
          <label>
            Username{' '}
            <input
              type="text"
              autoComplete="off"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </label>
          <label>
            Token{' '}
            <input
              type="text"
              className="secret"
              autoComplete="off"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </label>
        </div>
        <label>
          Host <input type="text" value={host} onChange={e => setHost(e.target.value)} />
        </label>
        <label>
          API base{' '}
          <input
            type="text"
            placeholder="https://api.github.com"
            value={apiBase}
            onChange={e => setApiBase(e.target.value)}
          />
        </label>
        <span className="modal-hint">Optional, only needed for GitHub Enterprise.</span>
      </div>
    </Modal>
  );
}
