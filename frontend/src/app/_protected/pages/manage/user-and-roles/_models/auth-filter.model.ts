
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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
  offset?: number;

  /**
   * How many records to return max.
   */
  limit?: number;
}

/**
 * Creates the query argument from the current object.
 * 
 * @param filter Auth filter to create query parameters from
 */
export function createAuthQuery(filter: AuthFilter, name: string) {
  let query = '';
  if (!filter) {
    return query;
  }
  if (filter.limit) {
    query += '?limit=' + filter.limit;
  }
  if (filter.offset) {
    if (filter !== '') {
      query += "&offset=" + filter.offset;
    } else {
      query += "?offset=" + filter.offset;
    }
  }
  if (filter.filter && filter.filter !== '') {
    query += `&${name}.like=` + encodeURIComponent(filter.filter + '%');
  }
  if (filter.order && filter.order !== '') {
    query += '&order=' + encodeURIComponent(filter.order);
  }
  if (filter.direction && filter.direction !== '') {
    query += '&direction=' + encodeURIComponent(filter.direction);
  }
  return query;
}
