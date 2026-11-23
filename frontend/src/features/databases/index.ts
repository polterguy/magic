import type { FeatureManifest } from '@core/features';
import { DatabaseIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/databases';

const manifest: FeatureManifest = {
  id: 'databases',
  path: PATH,
  page: lazy(() => import('./components/Databases')),
  nav: {
    label: 'Databases',
    Icon: DatabaseIcon,
    description: 'Create new databases, connect to existing ones, and take backups.',
    order: 10,
  },
  roomy: true,
};

export default manifest;
