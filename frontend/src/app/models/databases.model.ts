
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Application specific imports.
import { Database } from "../_protected/pages/database/_models/database.model";

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
