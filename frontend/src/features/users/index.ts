import type { FeatureManifest } from '@shared/shell/features';
import { UserIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/user-roles-management';

const manifest: FeatureManifest = {
  id: 'users',
  path: PATH,
  page: lazy(() => import('./pages/Users')),
  nav: {
    label: 'Users & roles',
    Icon: UserIcon,
    description: 'Decide who can reach your backend, and which roles gate which ' + 'endpoints.',
    order: 100,
  },
  roomy: true,
};

export default manifest;
