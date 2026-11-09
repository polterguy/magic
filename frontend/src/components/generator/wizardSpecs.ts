import { WizardSpec } from './types';

// The image operations ImagesWizard offers, each one [image.*] slot.

export const IMAGE_OPS: { key: string; label: string }[] = [
  { key: 'resize', label: 'Resize' },
  { key: 'crop', label: 'Crop' },
  { key: 'convert', label: 'Convert' },
  { key: 'size', label: 'Size' },
  { key: 'chart', label: 'Chart' },
  { key: 'generate-qr', label: 'QR code' },
];

/*
 * Tier-2 wizard specifications. The dangerous tier (system/python/git/github/dynamic
 * slots/config write) is deliberately omitted, configuration is left out entirely
 * because it exposes secrets, and identity is read-only - never minting a ticket.
 */
export const TIER2_WIZARDS: Record<string, WizardSpec> = {
  cache: {
    label: 'Cache',
    title: 'Caching',
    defaults: ['read'],
    groups: [
      {
        key: 'read',
        label: 'Read',
        slots: ['cache.get', 'cache.try-get', 'cache.list', 'cache.count'],
      },
      { key: 'write', label: 'Write', slots: ['cache.set', 'cache.clear'] },
    ],
  },
  sockets: {
    label: 'Sockets',
    title: 'Web sockets',
    defaults: ['signal'],
    groups: [
      {
        key: 'signal',
        label: 'Signal',
        title: 'Publish messages to connected clients',
        slots: ['sockets.signal'],
      },
      {
        key: 'groups',
        label: 'Groups',
        slots: [
          'sockets.connection.enter-group',
          'sockets.connection.leave-group',
          'sockets.user.add-to-group',
          'sockets.user.remove-from-group',
        ],
      },
      { key: 'users', label: 'Users', slots: ['sockets.users', 'sockets.users.count'] },
    ],
  },
  identity: {
    label: 'Identity',
    title: 'Identity (read only)',
    defaults: ['read'],
    note: 'Reads the caller identity only. Minting or refreshing a ticket is never offered — that is the escalation the sandbox exists to prevent. [auth.token.verify] is deliberately excluded: it trusts caller-supplied issuers and would turn the endpoint into an SSRF oracle.',
    groups: [
      {
        key: 'read',
        label: 'Read identity',
        slots: ['auth.ticket.get', 'auth.ticket.in-role', 'auth.ticket.verify', 'auth.token.read'],
      },
    ],
  },
  crypto: {
    label: 'Crypto',
    title: 'Cryptography',
    defaults: ['hashing', 'random'],
    groups: [
      {
        key: 'hashing',
        label: 'Hashing',
        slots: [
          'crypto.hash',
          'crypto.hash.md5',
          'crypto.hash.sha1',
          'crypto.hash.sha256',
          'crypto.hash.sha384',
          'crypto.hash.sha512',
          'crypto.password.hash',
          'crypto.password.verify',
        ],
      },
      {
        key: 'symmetric',
        label: 'Symmetric',
        slots: ['crypto.aes.encrypt', 'crypto.aes.decrypt', 'crypto.encrypt', 'crypto.decrypt'],
      },
      {
        key: 'rsa',
        label: 'RSA',
        slots: [
          'crypto.rsa.create-key',
          'crypto.rsa.encrypt',
          'crypto.rsa.decrypt',
          'crypto.rsa.sign',
          'crypto.rsa.verify',
          'crypto.sign',
          'crypto.verify',
          'crypto.get-key',
          'crypto.fingerprint',
        ],
      },
      {
        key: 'random',
        label: 'Random',
        slots: ['crypto.random', 'crypto.random.int', 'crypto.seed'],
      },
    ],
  },
  misc: {
    label: 'Misc',
    title: 'Other capabilities',
    defaults: [],
    groups: [
      {
        key: 'html2pdf',
        label: 'HTML → PDF',
        title: 'Render an HTML string to a PDF document',
        slots: ['html2pdf'],
      },
      {
        key: 'semaphore',
        label: 'Semaphore',
        title: 'Serialize concurrent invocations through a named lock',
        slots: ['semaphore'],
      },
      { key: 'version', label: 'Version', title: 'Return the server version', slots: ['version'] },
    ],
  },
  templating: {
    label: 'Templating',
    title: 'String templating',
    defaults: [],
    note: 'strings.mixin executes every {{ }} snippet in its template as Hyperlambda, using whatever slots this rule already grants — it does not add any new ones. Only feed it template strings the endpoint itself authored, never caller-supplied or stored text, or the caller effectively picks which of those slots run.',
    groups: [
      {
        key: 'mixin',
        label: 'Mixin',
        title: 'Interpolate {{ }} Hyperlambda snippets into a string',
        slots: ['strings.mixin'],
      },
    ],
  },
  ai: {
    label: 'AI',
    title: 'AI helpers',
    defaults: ['tokenize'],
    groups: [
      { key: 'tokenize', label: 'Tokenize', slots: ['openai.tokenize'] },
      {
        key: 'whisper',
        label: 'Transcribe',
        title: 'Speech-to-text with Whisper',
        slots: ['openai.whisper'],
      },
    ],
  },
  puppeteer: {
    label: 'Browser',
    title: 'Headless browser',
    defaults: ['browse'],
    groups: [
      {
        key: 'browse',
        label: 'Browse & read',
        slots: [
          'puppeteer.connect',
          'puppeteer.goto',
          'puppeteer.close',
          'puppeteer.url',
          'puppeteer.title',
          'puppeteer.content',
          'puppeteer.evaluate',
          'puppeteer.screenshot',
          'puppeteer.wait-for-selector',
          'puppeteer.wait-for-url',
        ],
      },
      {
        key: 'interact',
        label: 'Interact',
        slots: [
          'puppeteer.click',
          'puppeteer.type',
          'puppeteer.fill',
          'puppeteer.select',
          'puppeteer.press',
        ],
      },
    ],
  },
};
