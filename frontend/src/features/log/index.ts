import type { FeatureManifest } from '@core/features';
import { ListIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/log';

const manifest: FeatureManifest = {
  id: 'log',
  path: PATH,
  page: lazy(() => import('./Log')),
  nav: {
    label: 'Log',
    Icon: ListIcon,
    description:
      'Read what your backend has been doing, and dig into errors when ' + 'something goes wrong.',
    order: 140,
  },
  roomy: true,
};

export default manifest;
