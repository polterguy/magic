import type { FeatureManifest } from '@core/features';
import { PlayIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/hyperlambda-playground';

const manifest: FeatureManifest = {
  id: 'playground',
  path: PATH,
  page: lazy(() => import('./components/Playground')),
  nav: {
    label: 'Playground',
    Icon: PlayIcon,
    description:
      'Execute Hyperlambda on your server and see what it returns, ' +
      'without saving anything first.',
    order: 80,
  },
};

export default manifest;
