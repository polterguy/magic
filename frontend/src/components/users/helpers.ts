import { Role, User, userExtra } from '../../lib/api';

/*
 * One CSV row for the users export.
 *
 * OIDC users are stored locally as "provider:email", so the username column
 * drops everything through the first colon. Local usernames have no colon.
 */
export function userCsvRow(user: User) {
  return {
    username: user.username.replace(/^[^:]+:/, ''),
    name: userExtra(user, 'name'),
    email: userExtra(user, 'email'),
    roles: (user.roles ?? []).join(', '),
    created: user.created ?? '',
  };
}

// The roles whose name or description contains the filter, ignoring case and surrounding space.
export function filterRoles(roles: Role[], filter: string): Role[] {
  const query = filter.trim().toLowerCase();
  return roles.filter(
    role =>
      !query ||
      role.name.toLowerCase().includes(query) ||
      (role.description ?? '').toLowerCase().includes(query),
  );
}
