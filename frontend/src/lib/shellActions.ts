/*
 * The two overlays Layout owns — the command palette and the Chat Ops drawer.
 * Pages render as Layout's children rather than below it in the tree, so they
 * cannot reach that state through props. Layout registers its openers here and
 * anything can raise them, the same way toasts and nav guards work.
 */

let paletteOpener: (() => void) | null = null;
let chatOpsOpener: (() => void) | null = null;

export function setShellActions(actions: {
  openPalette: () => void;
  openChatOps: () => void;
} | null) {
  paletteOpener = actions?.openPalette ?? null;
  chatOpsOpener = actions?.openChatOps ?? null;
}

export function openPalette() {
  paletteOpener?.();
}

export function openChatOps() {
  chatOpsOpener?.();
}
