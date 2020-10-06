/**
 * Filter for invoking "auth" methods, allowing you to filter users/roles/etc.
 */
export class AuthFilter {

  /**
   * What filter to apply.
   */
  filter?: string;

  /**
   * Offset of where to start returning records.
   */
  offset: number;

  /**
   * How many records to return max.
   */
  limit: number;
}
