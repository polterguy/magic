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
import { useSearchParams } from 'react-router-dom';
import Tabs from '../components/Tabs';
import { mlTypes, openaiIsConfigured, type MlType } from '../lib/api';
import { showError } from '../lib/errors';
import HistoryTab from './ml/HistoryTab';
import TrainingTab from './ml/TrainingTab';
import ModelsTab from './ml/ModelsTab';
import QuestionnairesTab from './ml/QuestionnairesTab';

type Tab = 'types' | 'training' | 'history' | 'questionnaires';

export default function MachineLearning() {
  const [params, setParams] = useSearchParams();

  /*
   * The command palette links at one model's editor, or at one model's
   * training snippets. Jumping straight from one of those links to the other
   * does NOT remount this page — same route, different query — so the
   * parameters are read on every location change rather than once on arrival.
   *
   * They are also cleared here in a single write, rather than by each tab
   * clearing its own, since two tabs writing their own copy of the query would
   * race and one would resurrect the parameter the other had just removed.
   */
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'types');
  const [deepLink, setDeepLink] = useState<{ edit: string | null; type: string | null }>({
    edit: params.get('edit'),
    type: params.get('type'),
  });
  const [types, setTypes] = useState<MlType[]>([]);
  const [configured, setConfigured] = useState(true);

  // Picking the link up while rendering, the moment the query changes, rather than in an effect.
  const wanted = params.get('tab');
  const linkEdit = params.get('edit');
  const linkType = params.get('type');
  const hasLink = !!(wanted || linkEdit || linkType);
  const [seenParams, setSeenParams] = useState(params);
  if (seenParams !== params) {
    setSeenParams(params);
    if (hasLink) {
      if (wanted) {
        setTab(wanted as Tab);
      }
      setDeepLink({ edit: linkEdit, type: linkType });
    }
  }

  useEffect(() => {
    if (!hasLink) {
      return;
    }
    const next = new URLSearchParams(params);
    ['tab', 'edit', 'type'].forEach(name => next.delete(name));
    setParams(next, { replace: true });
  }, [hasLink, params, setParams]);

  const refreshTypes = useCallback(async () => {
    try {
      setTypes((await mlTypes()) ?? []);
    } catch (err) {
      showError(err);
    }
  }, []);

  useEffect(() => {
    mlTypes()
      .then(result => setTypes(result ?? []))
      .catch((err: unknown) => showError(err));
    openaiIsConfigured()
      .then(response => setConfigured(response.result))
      .catch(() => {});
  }, []);

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
          { id: 'questionnaires', label: 'Questionnaires' },
          { id: 'history', label: 'History' },
        ]}
        active={tab}
        onChange={id => setTab(id as Tab)}
      />
      {!configured && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          OpenAI is not configured — add your API key in Configuration before training or querying
          models.
        </div>
      )}
      {tab === 'types' && (
        <ModelsTab types={types} onChanged={refreshTypes} editOnOpen={deepLink.edit} />
      )}
      {tab === 'training' && <TrainingTab types={types} initialType={deepLink.type} />}
      {tab === 'questionnaires' && <QuestionnairesTab />}
      {tab === 'history' && <HistoryTab types={types} />}
    </>
  );
}
