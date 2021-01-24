
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
   * What column to order results by.
   */
  order?: string

  /**
   * What direction to order results by,
   * possible values being 'asc' or 'desc'.
   */
  direction?: string;

  /**
   * Offset of where to start returning records.
   */
  offset: number;

  /**
   * How many records to return max.
   */
  limit: number;
}
