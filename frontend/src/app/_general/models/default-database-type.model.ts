
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

/**
 * Default database and optional database types as
 * returned from backend.
 */
export class DefaultDatabaseType {

  /**
   * What type of database is your default.
   */
  default: string;

  /**
   * All database types existing in backend.
   */
  options: string[];
}
