/*
 * Inline SVG icons for the file tree — stroke follows currentColor so
 * they inherit whatever text color their container has.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <svg {...base} style={{
      transform: open ? 'rotate(90deg)' : undefined,
      transition: 'transform 0.12s',
    }}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function FolderIcon() {
  return (
    <svg {...base}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg {...base}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
    </svg>
  );
}

export function FilePlusIcon() {
  return (
    <svg {...base}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

export function FolderPlusIcon() {
  return (
    <svg {...base}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg {...base}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 8 12 3 17 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg {...base}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// A folder with an upload arrow — installing a module from an archive.
export function ModuleUploadIcon() {
  return (
    <svg {...base}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 14 12 11 15 14" />
      <line x1="12" y1="11" x2="12" y2="18" />
    </svg>
  );
}

export function SparkIcon() {
  return (
    <svg {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </svg>
  );
}

export function BracesIcon() {
  return (
    <svg {...base}>
      <path d="M8 4H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1" />
      <path d="M16 4h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg {...base}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...base}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/*
 * Icons for the dashboard's sections, used by both the navigation and the
 * Welcome guide. Same stroke weight as the rest of the set, and they inherit
 * currentColor so the active nav item turns them white.
 */

export function HomeIcon() {
  return (
    <svg {...base}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function CodeFileIcon() {
  return (
    <svg {...base}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <polyline points="10 12 8 14.5 10 17" />
      <polyline points="14 12 16 14.5 14 17" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...base}>
      <path d="M7 4l13 8-13 8z" />
    </svg>
  );
}

export function BugIcon() {
  return (
    <svg {...base}>
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <path d="M9 7a3 3 0 0 1 6 0" />
      <path d="M3 11h5M16 11h5M3 17h5M16 17h5M12 19v3" />
    </svg>
  );
}

export function TerminalIcon() {
  return (
    <svg {...base}>
      <polyline points="4 7 8 12 4 17" />
      <line x1="12" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export function DatabaseIcon() {
  return (
    <svg {...base}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg {...base}>
      <path d="M13 2L4 14h7l-1 8 10-12h-7z" />
    </svg>
  );
}

export function ExchangeIcon() {
  return (
    <svg {...base}>
      <path d="M4 9h16l-4-4" />
      <path d="M20 15H4l4 4" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16" y2="16" />
    </svg>
  );
}

export function KeyboardIcon() {
  return (
    <svg {...base}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6" />
      <path d="M8 16.5h8" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

export function PuzzleIcon() {
  return (
    <svg {...base}>
      <path d="M5 5h5V4a2 2 0 1 1 4 0v1h5v5h1a2 2 0 1 1 0 4h-1v5h-5v-1a2 2 0 1 0-4 0v1H5z" />
    </svg>
  );
}

/*
 * Sliders rather than a gear — a spoked gear collapses into the same
 * sunburst as SparkIcon at navigation size.
 */
export function SlidersIcon() {
  return (
    <svg {...base}>
      <path d="M5 20v-6M5 10V4M12 20v-9M12 7V4M19 20v-4M19 12V4" />
      <path d="M2.5 14h5M9.5 7h5M16.5 16h5" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="14" y2="17" />
    </svg>
  );
}

// A person inside a circle — distinct from UserIcon, which means "users".
export function ProfileIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.2 18.6a6 6 0 0 1 11.6 0" />
    </svg>
  );
}

// An eye — previewing a file the way a visitor to the website sees it.
export function EyeIcon() {
  return (
    <svg {...base}>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

// Two stacked sheets — copying something to the clipboard.
export function CopyIcon() {
  return (
    <svg {...base}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// A paperclip — attaching files to a message.
export function PaperclipIcon() {
  return (
    <svg {...base}>
      <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />
    </svg>
  );
}

// A question mark in a circle — asking for help.
export function HelpIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

// A floppy disk — saving the open file.
export function SaveIcon() {
  return (
    <svg {...base}>
      <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M8 4v5h7" />
      <rect x="8" y="14" width="8" height="7" />
    </svg>
  );
}

// The eye, struck through — the password is currently visible.
export function EyeOffIcon() {
  return (
    <svg {...base}>
      <path d="M2 12s3.6-6 10-6c1.6 0 3 .37 4.24.95M22 12s-3.6 6-10 6c-1.6 0-3-.37-4.24-.95" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <line x1="3" y1="21" x2="21" y2="3" />
    </svg>
  );
}

/*
 * Configuration. A cog rather than sliders, because sliders read as "tweak a
 * few values" and this screen is the whole appsettings.json.
 */
export function GearIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.2v2.7M12 19.1v2.7M21.8 12h-2.7M4.9 12H2.2M18.9 5.1l-1.9 1.9M7 17l-1.9 1.9M18.9 18.9 17 17M7 7 5.1 5.1" />
      <circle cx="12" cy="12" r="8.4" strokeDasharray="2.2 3.1" />
    </svg>
  );
}

/*
 * Frank, the support agent. He is a chatbot you talk to, so he gets a face —
 * the spark this used to be is the "AI generated this" mark used elsewhere,
 * and meant nothing as a person.
 */
export function RobotIcon() {
  return (
    <svg {...base}>
      <rect x="3.6" y="8" width="16.8" height="11.4" rx="3.4" />
      <path d="M12 8V4.9" />
      <circle cx="12" cy="3.4" r="1.4" />
      <path d="M1.4 12.6v2.9M22.6 12.6v2.9" />
      <circle cx="9.2" cy="12.9" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="12.9" r="1.15" fill="currentColor" stroke="none" />
      <path d="M9.6 16.4h4.8" />
    </svg>
  );
}

/*
 * Machine Learning — nodes and the edges between them. Embeddings and
 * retrieval are a graph, which a starburst never said.
 */
export function NeuralIcon() {
  return (
    <svg {...base}>
      <path d="M6.7 10.6 10.3 7.4M6.7 13.4l3.6 3.2M13.7 7.4l3.6 3.2M13.7 16.6l3.6-3.2" />
      <circle cx="4.8" cy="12" r="2.1" />
      <circle cx="12" cy="5.8" r="2.1" />
      <circle cx="12" cy="18.2" r="2.1" />
      <circle cx="19.2" cy="12" r="2.1" />
    </svg>
  );
}

// An enabled boolean in a table cell.
export function CheckIcon() {
  return (
    <svg {...base} strokeWidth={2.6}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/*
 * The off half of the pair. A dash rather than a cross, because "not enabled"
 * is a setting rather than a failure, and a red-looking × reads as one.
 */
export function DashIcon() {
  return (
    <svg {...base}>
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
      <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
      <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...base}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg {...base}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg {...base}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function GitBranchIcon() {
  return (
    <svg {...base}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <line x1="6" y1="8.5" x2="6" y2="15.5" />
      <path d="M18 10.5c0 3-3 4.5-6 4.5H9" />
    </svg>
  );
}
