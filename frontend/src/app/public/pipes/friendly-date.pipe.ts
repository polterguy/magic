
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Friendly date pipe, displaying dates in a friendly format.
 */
@Pipe({
  name: 'friendlyDate'
})
export class FriendlyDatePipe implements PipeTransform {

  /**
   * Transforms a Date object to something like '8. August 2022'.
   * 
   * @param value Value to transform
   */
  transform(value: any) {

    // Sanity checking invocation.
    if (!value) {
      return value;
    }

    if (value.indexOf && value.indexOf('+') === -1 && !value.endsWith('Z')) {
      value += '+00:00';
    }
    const date = new Date(value);
    let result = date.getDate().toString() + ' ';
    switch (date.getMonth()) {
      case 0:
        result += 'Jan';
        break;
      case 1:
        result += 'Feb';
        break;
      case 2:
        result += 'Mar';
        break;
      case 3:
        result += 'Apr';
        break;
      case 4:
        result += 'May';
        break;
      case 5:
        result += 'Jun';
        break;
      case 6:
        result += 'Jul';
        break;
      case 7:
        result += 'Aug';
        break;
      case 8:
        result += 'Sep';
        break;
      case 9:
        result += 'Oct';
        break;
      case 10:
        result += 'Nov';
        break;
      case 11:
        result += 'Dec';
        break;
    }
    result += ', ' + date.getFullYear();
    return result;
  }
}
