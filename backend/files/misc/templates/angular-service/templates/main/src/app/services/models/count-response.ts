/**
 * Common response class for invocations towards backend that counts items.
 */
export class CountResponse {

  /**
   * Number of items in backend matching filtering condition.
   */
  count: number;
}
