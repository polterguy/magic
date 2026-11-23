import Tabs from '@shared/ui/Tabs';
import { useState } from 'react';

import ExternalTab from '../components/ExternalTab';
import InternalTab from '../components/InternalTab';

export default function Databases() {
  const [tab, setTab] = useState<'internal' | 'external'>('internal');

  return (
    <>
      <div className="page-header">
        <h1>Databases</h1>
        <p>Manage your SQLite databases, and connect to external databases</p>
      </div>
      <Tabs
        tabs={[
          { id: 'internal', label: 'Internal (SQLite)' },
          { id: 'external', label: 'External' },
        ]}
        active={tab}
        onChange={id => setTab(id as 'internal' | 'external')}
      />
      {tab === 'internal' ? <InternalTab /> : <ExternalTab />}
    </>
  );
}
