
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Sort pipe that sorts an array of objects according to the specified parameter.
 */
@Pipe({
  name: 'sortBy',
  pure: false
})
export class SortByPipe implements PipeTransform {

  /**
   * Sorts the specified array according to the field specified.
   * 
   * @param array Array to sort
   * @param field Field to sort by
   * @returns Sorted array
   */
  transform(array: any, field: string) {
    if (!Array.isArray(array)) {
      return;
    }

    if (!field || field === '') {

      // No field specified, sorting by items themselves.
      array.sort((a: any, b: any) => {
        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        } else {
          return 0;
        }
      });
    } else {

      // Sorting by specified key
      array.sort((a: any, b: any) => {
        if (typeof a[field] === 'string' && typeof b[field] === 'string') {
          const lhs = (<string>a[field] || '').toLowerCase();
          const rhs = (<string>b[field] || '').toLowerCase();
          if (lhs < rhs) {
            return -1;
          } else if (lhs > rhs) {
            return 1;
          } else {
            return 0;
          }
        } else {
          return 0;
        }
      });
    }
    return array;
  }
}
