/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { http, type MagicResponse } from '@shared/api';

/*
 * Databases management.
 */

export function createDatabase(
  databaseType: string,
  connectionString: string,
  databaseName: string,
) {
  return http.post<MagicResponse>('/magic/system/sql/ddl/database', {
    databaseType,
    connectionString,
    databaseName,
  });
}

export function dropDatabase(databaseType: string, connectionString: string, databaseName: string) {
  return http.delete<MagicResponse>(
    '/magic/system/sql/ddl/database?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName),
  );
}

export function uploadDatabaseBackup(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.put<MagicResponse>('/magic/system/sql/backup', formData);
}

export function testConnectionString(databaseType: string, connectionString: string) {
  return http.post<{ result: string; message?: string }>(
    '/magic/system/sql/test-connection-string',
    { databaseType, connectionString },
  );
}

export function addConnectionString(
  databaseType: string,
  name: string,
  connectionString: string,
  useAsDefault: boolean,
) {
  return http.post<MagicResponse>('/magic/system/sql/connection-string', {
    databaseType,
    name,
    connectionString,
    useAsDefault,
  });
}

export function deleteConnectionString(databaseType: string, name: string) {
  return http.delete<MagicResponse>(
    '/magic/system/sql/connection-string?databaseType=' +
      encodeURIComponent(databaseType) +
      '&name=' +
      encodeURIComponent(name),
  );
}
