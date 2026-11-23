import './styles/configuration.css';

import type { FeatureManifest } from '@shared/shell/features';
import { GearIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/configuration';

const manifest: FeatureManifest = {
  id: 'configuration',
  path: PATH,
  page: lazy(() => import('./pages/Configuration')),
  nav: {
    label: 'Configuration',
    Icon: GearIcon,
    description:
      'Edit your appsettings.json directly — connection strings, SMTP, ' +
      'authentication and everything else your server runs on.',
    order: 120,
  },
};

export default manifest;
