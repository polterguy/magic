export const PAGE_SIZE = 15;

// Accounts and roles the backend depends on, and which therefore can't be deleted.
export const PROTECTED_ROLES = new Set(['root']);
export const PROTECTED_USERS = new Set(['root']);
