import type { FeatureManifest } from '@core/features';
import { UserIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/user-roles-management';

const manifest: FeatureManifest = {
  id: 'users',
  path: PATH,
  page: lazy(() => import('./components/Users')),
  nav: {
    label: 'Users & roles',
    Icon: UserIcon,
    description: 'Decide who can reach your backend, and which roles gate which ' + 'endpoints.',
    order: 100,
  },
  roomy: true,
};

export default manifest;
