import { useEffect, useState } from 'react';
import { availablePlugins, installPlugin, listFolders } from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { missingAgentPlugins } from '../constants';

// Which of the MCP and OAuth plugins are missing, and installing them.
export function useAgentPlugins() {
  const [missingPlugins, setMissingPlugins] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);

  /*
   * A plugin counts as installed when its module folder exists — checking
   * Bazar manifests instead would miss modules built by hand, which carry
   * no manifest.
   */
  useEffect(() => {
    listFolders('/modules/')
      .then(list => {
        const folders = list ?? [];
        setMissingPlugins(missingAgentPlugins(folders));
      })
      // Without a folder listing we can't tell — say nothing rather than nag.
      .catch(() => setMissingPlugins([]));
  }, []);

  async function installAgentPlugins() {
    setInstalling(true);
    try {
      const available = (await availablePlugins()) ?? [];
      for (const name of missingPlugins) {
        const app = available.find(candidate => candidate.name === name);
        if (!app) {
          throw new Error(name + ' is not available in the plugin repository');
        }
        await installPlugin(app);
      }
      showToast(
        'Installing ' + missingPlugins.join(' and ') + " — you'll be notified when it completes.",
      );
      /*
       * Installation continues on a background thread, so the module folders
       * won't exist yet — flip the card now rather than leaving it asking
       * for something already on its way.
       */
      setMissingPlugins([]);
    } catch (err) {
      showError(err);
    } finally {
      setInstalling(false);
    }
  }

  return { missingPlugins, installing, installAgentPlugins };
}
