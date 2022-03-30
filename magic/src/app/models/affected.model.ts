
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Generic model for endpoints returning affected number of records.
 * 
 * Typically the response returned from DELETE and PUT
 * invocations to automatically generated CRUD endpoints.
 */
export class Affected {

  /**
   * Affected records as returned from server.
   */
  affected: number;
}
  