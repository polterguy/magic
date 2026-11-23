import type { FeatureManifest } from '@core/features';
import { ProfileIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/user-profile';

const manifest: FeatureManifest = {
  id: 'profile',
  path: PATH,
  page: lazy(() => import('./Profile')),
  nav: {
    label: 'Profile',
    Icon: ProfileIcon,
    description:
      'Change your password, and generate long-lived access tokens ' +
      'for pipelines, service accounts and integrations.',
    order: 130,
  },
  roomy: true,
};

export default manifest;
