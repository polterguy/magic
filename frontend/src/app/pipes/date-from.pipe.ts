
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * From now pipe, displaying how many seconds/minutes/hours/etc from now a future date is.
 */
@Pipe({
  name: 'from'
})
export class DateFromPipe implements PipeTransform {

  /**
   * Transforms a future date and time to its "xxx units from now" representation.
   * 
   * @param value Value to transform
   */
  transform(value: any) {

    /*
     * Some components might return date and time objects as strings, WITHOUT timezone information
     * at which point we'll have to make assumptions. The best assumption is UTC.
     */
    if (value.indexOf && value.indexOf('+') === -1 && !value.endsWith('Z')) {
      value += '+00:00';
    }
    const dateWhen = new Date(value).getTime();
    const now = new Date().getTime();
    const deltaSeconds = Math.round((dateWhen - now) / 1000);
    if (deltaSeconds < 180) {
      return `${deltaSeconds} seconds from now`;
    }
    const deltaMinutes = Math.round(deltaSeconds / 60);
    if (deltaMinutes < 60) {
      return `${deltaMinutes} minutes from now`;
    }
    const deltaHours = Math.round(deltaMinutes / 60);
    if (deltaHours < 24) {
      return `${deltaHours} hours from now`;
    }
    const deltaDays = Math.round(deltaHours / 24);
    if (deltaDays < 60) {
      return `${deltaDays} days from now`;
    }
    const deltaWeeks = Math.round(deltaDays / 7);
    if (deltaWeeks < 20) {
      return `${deltaWeeks} weeks from now`;
    }
    const deltaMonths = Math.round(deltaWeeks / 4.2);
    return `${deltaMonths} months from now`;
  }
}
