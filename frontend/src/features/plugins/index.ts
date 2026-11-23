import type { FeatureManifest } from '@core/features';
import { PuzzleIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/plugins';

const manifest: FeatureManifest = {
  id: 'plugins',
  path: PATH,
  page: lazy(() => import('./components/Plugins')),
  nav: {
    label: 'Plugins',
    Icon: PuzzleIcon,
    description:
      'Install plugins from the plugin repository to extend what ' + 'your cloudlet can do.',
    order: 110,
  },
  roomy: true,
};

export default manifest;
