
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

export interface SetupModel {
  password: string | null,
  connectionString: string | null,
  defaultTimeZone: string | null,
  databaseType: string | null,
  name: string | null,
  email: string | null,
}
