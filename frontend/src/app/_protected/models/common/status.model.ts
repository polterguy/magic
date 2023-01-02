
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
