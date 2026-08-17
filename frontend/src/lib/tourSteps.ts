/*
 * Guided-tour content. Each step names an element through its [data-tour]
 * attribute, and the tour drops any step whose element is not on screen —
 * so the dashboard's conditional widgets (the OpenAI key prompt disappears
 * once a key exists, the Chatbot Wizard only appears once one does) filter
 * themselves out without the tour knowing anything about that state.
 *
 * A step with no [target] is a plain centred card, for opening and closing.
 */

export interface TourStep {
  // Value of the [data-tour] attribute to spotlight, or undefined for a card.
  target?: string;
  title: string;
  body: string;
}

export const DASHBOARD_TOUR: TourStep[] = [
  {
    title: 'Welcome to your cloudlet',
    body: 'A quick tour of the four things on this screen worth knowing about. ' +
      'Thirty seconds, and you can skip at any point.',
  },
  {
    target: 'mcp',
    title: 'Your cloudlet is an AI agent',
    body: 'Install MCP and every endpoint here becomes a callable tool for ' +
      'Claude, Cursor or any MCP client — filtered by the roles your token ' +
      'carries. Once installed, the connection URL appears in this card.',
  },
  {
    target: 'openai-key',
    title: 'Add your OpenAI API key',
    body: 'This unlocks the rest: the Chatbot Wizard, the AI Expert System, ' +
      'and Chat Ops — the assistant on Ctrl+. that builds things for you. ' +
      'You pick the model, and you pay OpenAI directly.',
  },
  {
    target: 'chatbot-wizard',
    title: 'Build a chatbot from a website',
    body: 'Give it a URL and it crawls the site, turns the content into ' +
      'training data, and hands you a chatbot to embed. There is a tour for ' +
      'this one too — the link sits at the bottom of the card.',
  },
  {
    target: 'api-wizard',
    title: 'Three ways to build an API',
    body: 'Point it at a database and every table becomes secured CRUD ' +
      'endpoints, with paging, sorting and role checks. Or publish your own ' +
      'SQL as an endpoint. Or wrap somebody else\'s API from its OpenAPI ' +
      'specification. All three produce files you can edit.',
  },
  {
    target: 'expert-system',
    title: 'The AI Expert System',
    body: 'A ready-made chat frontend served from your cloudlet root, with ' +
      'sign-in, sessions and your own models behind it. One click installs it.',
  },
  {
    target: 'frontend',
    title: 'Your frontend',
    body: 'Your cloudlet is serving an application at its root URL. Anything ' +
      'you put in the /etc/www/ folder is served straight to the web.',
  },
  {
    title: 'That is the tour',
    body: 'Everything else lives in the sidebar. Press Ctrl+K to jump to any ' +
      'page, file or endpoint, or open "What everything does" below for the ' +
      'full map. Re-run this tour any time from the command palette.',
  },
];

export const CHATBOT_TOUR: TourStep[] = [
  {
    target: 'chatbot-wizard',
    title: 'The Chatbot Wizard',
    body: 'This builds a working chatbot from a website in one pass: crawl, ' +
      'train, embed. Here is what each field decides.',
  },
  {
    target: 'chatbot-url',
    title: 'The website to learn from',
    body: 'The crawler starts here and follows links within the same site. ' +
      'It reads the content the page marks as its own — menus and footers ' +
      'never make it into the training data.',
  },
  {
    target: 'chatbot-model',
    title: 'Which model answers',
    body: 'This is the model your visitors talk to, priced per million ' +
      'tokens. The cheapest model is usually enough: the answers come from ' +
      'your own content, not from what the model remembers.',
  },
  {
    target: 'chatbot-persona',
    title: 'How it should behave',
    body: 'The persona writes the system instruction — a support agent, a ' +
      'sales rep, a documentation bot. You can rewrite it afterwards under ' +
      'Machine Learning.',
  },
  {
    target: 'chatbot-pages',
    title: 'How much to crawl',
    body: 'The page ceiling for this crawl. Start small to see the quality, ' +
      'then re-crawl wider — pages are split by subject, so a big site ' +
      'becomes many small, precisely retrievable snippets.',
  },
  {
    target: 'chatbot-create',
    title: 'Create the chatbot',
    body: 'The crawl runs on the server and reports progress here — it takes ' +
      'a few minutes. When it finishes you get an embed snippet, and the ' +
      'training data is yours to edit under Machine Learning.',
  },
];
