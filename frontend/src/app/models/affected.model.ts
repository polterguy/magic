
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
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
