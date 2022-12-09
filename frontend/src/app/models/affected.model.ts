
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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
