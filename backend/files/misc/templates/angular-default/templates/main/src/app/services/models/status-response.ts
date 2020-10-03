/**
 * Common response class for invocations towards backend not returning
 * any particular data, besides "success", "failure", etc.
 */
export class StatusResponse {

  /**
   * Status as reported from backend. Normally "success".
   */
  result: string;
}
