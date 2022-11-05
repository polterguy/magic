
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Status of setup process.
 */
export class Status {

  /**
   * True if the system has been setup.
   */
  result: boolean;
}

export interface SetupModel {
  password: string | null,
  connectionString: string | null,
  defaultTimeZone: string | null,
  databaseType: string | null,
  name: string | null,
  email: string | null,
}
