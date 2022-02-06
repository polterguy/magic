
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Application specific imports.
import { Argument } from "./argument.model";

/**
 * Endpoint model describing a single endpoint in your backend,
 * and its meta information.
 */
export class Endpoint {

  /**
   * Relative URL of endpoint.
   */
  path: string;

  /**
   * HTTP verb for endpoint.
   */
  verb: string;

  /**
   * Accept HTTP header of endpoint, or what Content-Type it can consume.
   */
  consumes?: string;

  /**
   * Content-Type HTTP header endpoint will produce.
   */
  produces?: string;

  /**
   * Input arguments the endpoint can handle.
   */
  input?: Argument[];

  /**
   * Structure of value(s) endpoint might return.
   */
  output?: Argument[];

  /**
   * Whether or not the endpoint returns an array of elements or not.
   */
  array?: boolean;

  /**
   * List of roles that are allowed to invoke endpoint.
   */
  auth?: string[];

  /**
   * Meta data describing type of endpoint, such as "crud-read", etc.
   */
  type?: string;

  /**
   * Descriptive text for endpoint.
   */
  description?: string;

  /**
   * If an error occurs during retrieval of endpoint this will contain the exception error message.
   */
  error?: string;
}
