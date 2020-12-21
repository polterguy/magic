
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Date pipe, displaying dates in a friendly format.
 */
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {

  transform(value: any) {
    const date = new Date(value);
    return date.toLocaleString();
  }
}
