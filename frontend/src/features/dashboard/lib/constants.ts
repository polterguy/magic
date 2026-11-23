/*
 * Constants and pure helpers behind the dashboard's cards — nothing here
 * touches the network, the DOM, or React.
 */

/*
 * Plugins that turn the cloudlet into an AI-agent endpoint — MCP exposes its
 * endpoints as tools, OAuth secures them.
 */
export const AGENT_PLUGINS = ['mcp', 'oauth'];

/*
 * Most MCP clients degrade badly past roughly this many tools — the agent
 * drowns in its own tool list and picks poorly, or refuses to connect at all.
 */
export const MCP_ENDPOINT_WARNING = 300;

/*
 * The AI Expert System is a frontend plugin rather than a module: installing
 * it unzips a complete chat client into /etc/www/, which the cloudlet serves
 * at its root URL.
 */
export const EXPERT_SYSTEM_PLUGIN = 'xpert-system';

// Roughly a minute of two-second polls, which is ample for a download and unzip.
export const EXPERT_SYSTEM_POLLS = 30;

/*
 * The first handful of tasks, runnable straight from the dashboard. Editing
 * and scheduling stay in the Task Manager — this is only for firing one off.
 */
export const TASK_PAGE_SIZE = 6;

// The balanced, cost-sensible default, matching the "default" model type.
export const DEFAULT_BOT_MODEL = 'gpt-6-luna';

// The endpoint an AI agent connects to for tool discovery.
export function mcpEndpointUrl(backendUrl: string | undefined) {
  return (backendUrl ?? '') + '/magic/modules/mcp/mcp';
}

/*
 * A plugin counts as installed when its module folder exists — checking
 * Bazar manifests instead would miss modules built by hand, which carry
 * no manifest.
 */
export function missingAgentPlugins(folders: string[]) {
  return AGENT_PLUGINS.filter(name => !folders.includes('/modules/' + name + '/'));
}

// Total task count to page count; an unknown count is a single page.
export function taskPageCount(count: number | null) {
  return count === null ? 1 : Math.max(1, Math.ceil(count / TASK_PAGE_SIZE));
}

/*
 * The wizard builds a landing page named after the model and
 * announces it: "Creating default landing page for <model> by
 * copying <url>". The page lives at the backend URL + that name.
 * Fall back to the vectorised model name if the wording changes.
 */
export function chatbotModelFromProgress(text: string) {
  return /landing page for (\S+)/.exec(text)?.[1] ?? /model '([^']+)'/.exec(text)?.[1];
}
