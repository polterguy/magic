
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Date pipe, displaying dates in a friendly format according to user's locale.
 */
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {

  /**
   * Transforms a Date object to its locale string representation.
   * 
   * @param value Value to transform
   */
  transform(value: any) {
    const date = new Date(value);
    return date.toLocaleString();
  }
}
