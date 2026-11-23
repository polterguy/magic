import { useAuth } from '@shared/auth/useAuth';
import { showToast } from '@shared/lib/toast';
import { hasFeature } from '@shared/shell/features';
import { openChatOps, openPalette } from '@shared/shell/shellActions';
import { isMac } from '@shared/shell/shortcuts';
import { RobotIcon, SearchIcon } from '@shared/ui/Icons';
import OpenAiKeyDialog from '@shared/ui/OpenAiKeyDialog';
import { useState } from 'react';

import {
  AgentPluginsCard,
  ApiWizardCard,
  ExpertSystemCard,
  OpenAiKeyCard,
} from '../components/ActionCards';
import CreateChatbot from '../components/CreateChatbot';
import GuideDetails from '../components/GuideDetails';
import KpiCards from '../components/KpiCards';
import SetPasswordDialog from '../components/SetPasswordDialog';
import TaskSection from '../components/TaskSection';
import Tour from '../components/Tour';
import { EndpointWarningDialog, PublicEndpointWarningDialog } from '../components/WarningDialogs';
import { useAgentPlugins } from '../hooks/useAgentPlugins';
import { useDashboardCounts } from '../hooks/useDashboardCounts';
import { useDashboardTour } from '../hooks/useDashboardTour';
import { useExpertSystem } from '../hooks/useExpertSystem';
import { useMagicLinkPassword } from '../hooks/useMagicLinkPassword';
import { useOpenAiConfigured } from '../hooks/useOpenAiConfigured';
import { mcpEndpointUrl } from '../lib/constants';
import { CHATBOT_TOUR, DASHBOARD_TOUR } from '../lib/tourSteps';

export default function Dashboard() {
  const { backend, version } = useAuth();
  const { mustSetPassword, setMustSetPassword } = useMagicLinkPassword();
  const { endpoints, publicEndpoints, users, tasks, logItems } = useDashboardCounts();
  const { missingPlugins, installing, installAgentPlugins } = useAgentPlugins();
  const { openaiConfigured, setOpenaiConfigured, configuringOpenai, setConfiguringOpenai } =
    useOpenAiConfigured();
  const { rootServed, installingExpertSystem, installExpertSystem } = useExpertSystem();
  const [showEndpointWarning, setShowEndpointWarning] = useState(false);
  const [showPublicEndpointWarning, setShowPublicEndpointWarning] = useState(false);
  const { tour, setTour, closeTour } = useDashboardTour(
    backend?.url,
    mustSetPassword,
    openaiConfigured,
    rootServed,
  );

  // The endpoint an AI agent connects to for tool discovery.
  const mcpUrl = mcpEndpointUrl(backend?.url);

  return (
    <div className="dash-page">
      {tour && (
        <Tour steps={tour === 'chatbot' ? CHATBOT_TOUR : DASHBOARD_TOUR} onClose={closeTour} />
      )}
      <div className="page-header dash-header">
        <div className="dash-header-title">
          <h1>Dashboard</h1>
          <p className="dash-connection">
            <span className="dash-live-dot" aria-hidden="true" />
            <span>
              Connected to {backend?.url} as {backend?.username}
            </span>
          </p>
        </div>
        <div className="dash-header-tools">
          <span className="dash-chip" title="The Magic version this cloudlet runs">
            <span className="muted">magic</span>
            <span>{version}</span>
          </span>
          <button type="button" className="btn btn-secondary btn-small" onClick={openPalette}>
            <SearchIcon /> Search <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          {openaiConfigured === true && hasFeature('chat') && (
            <button type="button" className="btn btn-small" onClick={openChatOps}>
              <RobotIcon /> Chat Ops
            </button>
          )}
        </div>
      </div>
      <KpiCards
        endpoints={endpoints}
        publicEndpoints={publicEndpoints}
        users={users}
        tasks={tasks}
        logItems={logItems}
        onEndpointWarning={() => setShowEndpointWarning(true)}
        onPublicEndpointWarning={() => setShowPublicEndpointWarning(true)}
      />
      <div className="dash-grid">
        <AgentPluginsCard
          missingPlugins={missingPlugins}
          installing={installing}
          onInstall={installAgentPlugins}
          mcpUrl={mcpUrl}
        />
        {openaiConfigured === false && (
          <OpenAiKeyCard onConfigure={() => setConfiguringOpenai(true)} />
        )}
        {openaiConfigured === true && <CreateChatbot onTour={() => setTour('chatbot')} />}
        <div className="dash-pair">
          <ApiWizardCard />
          <ExpertSystemCard
            rootServed={rootServed}
            installing={installingExpertSystem}
            onInstall={installExpertSystem}
            backendUrl={backend?.url}
          />
        </div>
        <TaskSection count={tasks} />
        <GuideDetails openaiConfigured={openaiConfigured} />
      </div>
      {showEndpointWarning && (
        <EndpointWarningDialog
          endpoints={endpoints}
          onClose={() => setShowEndpointWarning(false)}
        />
      )}
      {showPublicEndpointWarning && (
        <PublicEndpointWarningDialog
          publicEndpoints={publicEndpoints}
          onClose={() => setShowPublicEndpointWarning(false)}
        />
      )}
      {mustSetPassword && <SetPasswordDialog onClose={() => setMustSetPassword(false)} />}
      {configuringOpenai && (
        <OpenAiKeyDialog
          onClose={() => setConfiguringOpenai(false)}
          onSaved={() => {
            setConfiguringOpenai(false);
            setOpenaiConfigured(true);
            showToast('Your OpenAI API key was saved to your configuration');
          }}
        />
      )}
    </div>
  );
}
