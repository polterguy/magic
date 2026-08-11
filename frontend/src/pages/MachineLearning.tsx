/*
 * Machine Learning page — the tab shell over the ml_types registry, its
 * training data, and its request history. The tabs themselves and their
 * dialogs live under ./ml/, one file each.
 *
 * Notifications go to the toast stack. An inline banner is part of the page,
 * so showing one pushed everything below it down — the editors and grids
 * jumped under the pointer. Toasts float above the page instead.
 */

import { useCallback, useEffect, useState } from 'react';
import Tabs from '../components/Tabs';
import { mlTypes, openaiIsConfigured } from '../lib/api';
import { showToast } from '../lib/toast';
import HistoryTab from './ml/HistoryTab';
import TrainingTab from './ml/TrainingTab';
import ModelsTab from './ml/ModelsTab';

type Tab = 'types' | 'training' | 'history';

export default function MachineLearning() {

  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [configured, setConfigured] = useState(true);

  const refreshTypes = useCallback(async () => {
    try {
      setTypes(await mlTypes() ?? []);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    }
  }, []);

  useEffect(() => {
    refreshTypes();
    openaiIsConfigured()
      .then(response => setConfigured(response.result))
      .catch(() => {});
  }, [refreshTypes]);

  return (
    <>
      <div className="page-header">
        <h1>Machine Learning</h1>
        <p>Your AI models, training data, and AI functions</p>
      </div>
      <Tabs
        tabs={[
          { id: 'types', label: 'Models' },
          { id: 'training', label: 'Training data' },
          { id: 'history', label: 'History' },
        ]}
        active={tab}
        onChange={id => setTab(id as Tab)} />
      {!configured && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          OpenAI is not configured — add your API key in Configuration before
          training or querying models.
        </div>
      )}
      {tab === 'types' &&
        <ModelsTab types={types} onChanged={refreshTypes} />}
      {tab === 'training' &&
        <TrainingTab types={types} />}
      {tab === 'history' &&
        <HistoryTab types={types} />}
    </>
  );
}
