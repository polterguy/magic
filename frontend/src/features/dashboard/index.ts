import './styles/dashboard.css';

import type { FeatureManifest } from '@shared/shell/features';
import { HomeIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/';

const manifest: FeatureManifest = {
  id: 'dashboard',
  path: PATH,
  page: lazy(() => import('./pages/Dashboard')),
  nav: {
    label: 'Dashboard',
    Icon: HomeIcon,
    order: 0,
  },
};

export default manifest;
