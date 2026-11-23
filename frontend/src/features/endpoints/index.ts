import type { FeatureManifest } from '@core/features';
import { ExchangeIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/endpoints';

const manifest: FeatureManifest = {
  id: 'endpoints',
  path: PATH,
  page: lazy(() => import('./components/Endpoints')),
  nav: {
    label: 'Endpoints',
    Icon: ExchangeIcon,
    description:
      'Browse every endpoint by module, invoke them with real ' +
      'arguments, and grab their OpenAPI specification.',
    order: 40,
  },
  roomy: true,
  palette: { entries: () => import('./lib/palette').then(module => module.paletteEntries(PATH)) },
};

export default manifest;
