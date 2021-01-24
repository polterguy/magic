
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
  