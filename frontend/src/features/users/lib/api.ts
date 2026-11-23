/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is core/api.
 */
import { http, type MagicResponse, type User } from '@core/api';

// Value of an extra field, or empty when the user hasn't got that field.
export function userExtra(user: User, type: string) {
  return user.extra?.find(entry => entry.type === type)?.value ?? '';
}

export function createUser(username: string, password: string) {
  return http.post<MagicResponse>('/magic/system/magic/users', { username, password });
}

export function deleteUser(username: string) {
  return http.delete<MagicResponse>(
    '/magic/system/magic/users?username=' + encodeURIComponent(username),
  );
}

export function changeUserPassword(username: string, password: string) {
  return http.put<MagicResponse>('/magic/system/magic/users', { username, password });
}

export function createRole(name: string, description: string) {
  return http.post<MagicResponse>('/magic/system/magic/roles', { name, description });
}

export function updateRole(name: string, description: string) {
  return http.put<MagicResponse>('/magic/system/magic/roles', { name, description });
}

export function deleteRole(name: string) {
  return http.delete<MagicResponse>('/magic/system/magic/roles?name=' + encodeURIComponent(name));
}

export function addUserToRole(user: string, role: string) {
  return http.post<MagicResponse>('/magic/system/magic/users_roles', { user, role });
}

export function removeUserFromRole(user: string, role: string) {
  return http.delete<MagicResponse>(
    '/magic/system/magic/users_roles?user=' +
      encodeURIComponent(user) +
      '&role=' +
      encodeURIComponent(role),
  );
}
