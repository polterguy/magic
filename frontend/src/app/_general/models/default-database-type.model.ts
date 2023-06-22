
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
