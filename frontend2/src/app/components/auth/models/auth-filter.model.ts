
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Filter for invoking "auth" methods, allowing you to filter users/roles/etc.
 */
export class AuthFilter {

  /**
   * What filter to apply.
   * Basically any Magic filter for columns, such as for instance.
   * - username.eq
   * - username.like
   * - Etc
   */
  filter?: any;

  /**
   * Offset of where to start returning records.
   */
  offset: number;

  /**
   * How many records to return max.
   */
  limit: number;
}
