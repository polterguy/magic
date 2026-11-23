import type { FeatureManifest } from '@core/features';
import { TerminalIcon } from '@shared/ui/Icons';
import { lazy } from 'react';

const PATH = '/sql-studio';

const manifest: FeatureManifest = {
  id: 'sql',
  path: PATH,
  page: lazy(() => import('./components/Sql')),
  nav: {
    label: 'SQL Studio',
    Icon: TerminalIcon,
    description:
      'Query your databases, and design them — create tables, add ' +
      'columns and foreign keys without writing the DDL yourself.',
    order: 20,
  },
};

export default manifest;
