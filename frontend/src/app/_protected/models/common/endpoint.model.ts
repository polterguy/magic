
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

/**
 * Encapsulates a single endpoint in your backend.
 */
export class Endpoint {

  /**
   * Relative URL to endpoint.
   */
  path: string;

  /**
   * HTTP verb used to access endpoint.
   */
  verb: string;

  /**
   * List of roles user must belong to in order to successfully invoke endpoint.
   */
  auth: string[];

  /**
   * Descriptive text of what invoking endpoint actually does.
   */
  description: string;

  /**
   * Content-Type endpoint accepts.
   */
  consumes: string;

  /**
   * Content-Type endpoint produces.
   */
  produces: string;

  /**
   * Type of endpoint (meta data), e.g. "crud-read" for CRUD read endpoints, etc.
   */
  type: string;

  /**
   * Input endpoint can legally accept.
   */
  input: any;

  /**
   * True if endpoints has been expanded.
   */
  expanded?: boolean;
}
