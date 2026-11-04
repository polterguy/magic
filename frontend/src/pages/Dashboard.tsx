import OpenAiKeyDialog from '../components/OpenAiKeyDialog';
import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import Tour from '../components/Tour';
import { CHATBOT_TOUR, DASHBOARD_TOUR } from '../lib/tourSteps';
import { showToast } from '../lib/toast';
import { mcpEndpointUrl } from '../components/dashboard/constants';
import { useMagicLinkPassword } from '../components/dashboard/hooks/useMagicLinkPassword';
import { useDashboardCounts } from '../components/dashboard/hooks/useDashboardCounts';
import { useAgentPlugins } from '../components/dashboard/hooks/useAgentPlugins';
import { useOpenAiConfigured } from '../components/dashboard/hooks/useOpenAiConfigured';
import { useExpertSystem } from '../components/dashboard/hooks/useExpertSystem';
import { useDashboardTour } from '../components/dashboard/hooks/useDashboardTour';
import KpiCards from '../components/dashboard/KpiCards';
import {
  AgentPluginsCard,
  ApiWizardCard,
  ExpertSystemCard,
  OpenAiKeyCard,
} from '../components/dashboard/ActionCards';
import CreateChatbot from '../components/dashboard/CreateChatbot';
import GuideDetails from '../components/dashboard/GuideDetails';
import TaskSection from '../components/dashboard/TaskSection';
import SetPasswordDialog from '../components/dashboard/SetPasswordDialog';
import {
  EndpointWarningDialog,
  PublicEndpointWarningDialog,
} from '../components/dashboard/WarningDialogs';

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
    <>
      {tour && (
        <Tour steps={tour === 'chatbot' ? CHATBOT_TOUR : DASHBOARD_TOUR} onClose={closeTour} />
      )}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          Connected to {backend?.url} as {backend?.username}
        </p>
      </div>
      <KpiCards
        version={version}
        endpoints={endpoints}
        publicEndpoints={publicEndpoints}
        users={users}
        tasks={tasks}
        logItems={logItems}
        onEndpointWarning={() => setShowEndpointWarning(true)}
        onPublicEndpointWarning={() => setShowPublicEndpointWarning(true)}
      />
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
      <ApiWizardCard />
      <ExpertSystemCard
        rootServed={rootServed}
        installing={installingExpertSystem}
        onInstall={installExpertSystem}
        backendUrl={backend?.url}
      />
      <GuideDetails openaiConfigured={openaiConfigured} />
      <TaskSection count={tasks} />
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
    </>
  );
}
