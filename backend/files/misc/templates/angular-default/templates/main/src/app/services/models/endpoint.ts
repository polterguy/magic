/**
 * Endpoint model, encapsulating a single endpoint/verb combination,
 * combined with what roles are allowed to access endpoint with the
 * specified verb.
 */
export class Endpoint {

  /**
   * Relative URL to endpoint.
   */
  path: string;

  /**
   * HTTP verb for endpoint, normally either GET, PUT, POST, DELETE.
   */
  verb: string;

  /**
   * List of roles allowed to access path/verb combination.
   * If empty, everybody have access, including anonymous invocations.
   */
  auth: string[];
}
