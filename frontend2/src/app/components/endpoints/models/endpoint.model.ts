
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
   * What type of payload your endpoint accepts as input.
   * 
   * Notice, GET and DELETE endpoints doesn't have any type of input.
   */
  input_type?: string;

  /**
   * What type of payload your endpoint returns.
   */
  output_type?: string;

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
}
