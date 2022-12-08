
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortBy',
  pure: false
})
export class SortByPipe implements PipeTransform {

  transform(array: any, field: string) {
    if (!Array.isArray(array)) {
      return;
    }
    if (field === '') {
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
      array.sort((a: any, b: any) => {
        if (typeof a[field] === 'string' && typeof b[field] === 'string') {
          if (((<string>a[field] || '').toLowerCase()) < ((<string>b[field] || '').toLowerCase())) {
            return -1;
          } else if (((<string>a[field] || '').toLowerCase()) > ((<string>b[field] || '').toLowerCase())) {
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
