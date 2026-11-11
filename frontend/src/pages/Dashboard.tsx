import { useState } from 'react';

import {
  AgentPluginsCard,
  ApiWizardCard,
  ExpertSystemCard,
  OpenAiKeyCard,
} from '../components/dashboard/ActionCards';
import { mcpEndpointUrl } from '../components/dashboard/constants';
import CreateChatbot from '../components/dashboard/CreateChatbot';
import GuideDetails from '../components/dashboard/GuideDetails';
import { useAgentPlugins } from '../components/dashboard/hooks/useAgentPlugins';
import { useDashboardCounts } from '../components/dashboard/hooks/useDashboardCounts';
import { useDashboardTour } from '../components/dashboard/hooks/useDashboardTour';
import { useExpertSystem } from '../components/dashboard/hooks/useExpertSystem';
import { useMagicLinkPassword } from '../components/dashboard/hooks/useMagicLinkPassword';
import { useOpenAiConfigured } from '../components/dashboard/hooks/useOpenAiConfigured';
import KpiCards from '../components/dashboard/KpiCards';
import SetPasswordDialog from '../components/dashboard/SetPasswordDialog';
import TaskSection from '../components/dashboard/TaskSection';
import {
  EndpointWarningDialog,
  PublicEndpointWarningDialog,
} from '../components/dashboard/WarningDialogs';
import { RobotIcon, SearchIcon } from '../components/Icons';
import OpenAiKeyDialog from '../components/OpenAiKeyDialog';
import Tour from '../components/Tour';
import { openChatOps, openPalette } from '../lib/shellActions';
import { isMac } from '../lib/shortcuts';
import { showToast } from '../lib/toast';
import { CHATBOT_TOUR, DASHBOARD_TOUR } from '../lib/tourSteps';
import { useAuth } from '../lib/useAuth';

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
          {openaiConfigured === true && (
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
