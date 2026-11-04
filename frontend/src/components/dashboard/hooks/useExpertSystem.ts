import { useEffect, useState } from 'react';
import { availablePlugins, installPlugin, listFiles } from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { EXPERT_SYSTEM_PLUGIN, EXPERT_SYSTEM_POLLS } from '../constants';

/*
 * Whether anything at all is being served at the cloudlet's root URL. Any
 * frontend owns /etc/www/index.html, so this can't tell the Expert System
 * apart from some other app — which is the right question anyway, since
 * either way the root URL is taken.
 */
async function rootIsServed() {
  const files = (await listFiles('/etc/www/')) ?? [];
  return files.includes('/etc/www/index.html');
}

// Whether the cloudlet's root URL is taken, and installing the Expert System onto it.
export function useExpertSystem() {
  // Same again — neither the install nor the open button shows until we know.
  const [rootServed, setRootServed] = useState<boolean | null>(null);
  const [installingExpertSystem, setInstallingExpertSystem] = useState(false);

  useEffect(() => {
    rootIsServed()
      .then(setRootServed)
      .catch(() => setRootServed(null));
  }, []);

  async function installExpertSystem() {
    setInstallingExpertSystem(true);
    try {
      const available = (await availablePlugins()) ?? [];
      const app = available.find(candidate => candidate.name === EXPERT_SYSTEM_PLUGIN);
      if (!app) {
        throw new Error('The AI Expert System is not available in the plugin repository');
      }
      await installPlugin(app);
      /*
       * The backend downloads and unzips on a background thread, so the files
       * are not there yet when the call returns. Wait for them instead of
       * flipping the card straight away — offering to open a root URL that
       * nothing is serving yet would just hand the user a 404.
       */
      for (let attempt = 0; attempt < EXPERT_SYSTEM_POLLS; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (await rootIsServed()) {
          setRootServed(true);
          showToast('The AI Expert System is installed');
          return;
        }
      }
      showToast(
        'The AI Expert System is taking longer than expected to install — check your log',
        true,
      );
    } catch (err) {
      showError(err);
    } finally {
      setInstallingExpertSystem(false);
    }
  }

  return { rootServed, installingExpertSystem, installExpertSystem };
}
