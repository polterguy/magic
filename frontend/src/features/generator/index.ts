import type { FeatureManifest } from '@core/features';
import { BoltIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/generator';

const manifest: FeatureManifest = {
  id: 'generator',
  path: PATH,
  page: lazy(() => import('./components/Generator')),
  nav: {
    label: 'Endpoint Generator',
    Icon: BoltIcon,
    description:
      'Generate complete CRUD APIs from your database tables, or wrap ' +
      'a custom SQL statement in an endpoint of its own.',
    order: 30,
  },
  roomy: true,
  palette: { links: [{ label: 'Create an API from your data', to: '?guided=1' }] },
};

export default manifest;
