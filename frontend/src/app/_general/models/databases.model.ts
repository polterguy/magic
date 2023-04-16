
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

// Application specific imports.
import { Database } from "./database.model";

/**
 * Database meta information type, describing all databases in
 * a single database server, name of databases,
 * tables, and columns information etc.
 */
export class Databases {

  /**
   * List of all databases in a single database server.
   */
  databases: Database[];
}
