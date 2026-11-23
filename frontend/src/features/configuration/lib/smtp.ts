/*
 * A port the SMTP settings can be saved with: a whole number from 1 to 65535. An empty
 * field would otherwise be saved as 0, and anything that isn't a number as null.
 */
export function isValidPort(text: string): boolean {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return false;
  }
  const port = Number(trimmed);
  return port >= 1 && port <= 65535;
}
