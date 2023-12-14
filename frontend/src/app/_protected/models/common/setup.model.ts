
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

export interface SetupModel {
  password: string | null,
  connectionString: string | null,
  defaultTimeZone: string | null,
  databaseType: string | null,
  name: string | null,
  email: string | null,
}
