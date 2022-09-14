import { Pipe, PipeTransform } from '@angular/core';

/**
 * Date formatting pipe, simply creating a locale string
 * from the specified date, assumed to be a string, as returned
 * from the backend.
 */
@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {
  transform(value: any): any {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      if ((<string>value).indexOf('+') === -1 && (<string>value).indexOf('Z') === -1) {
        value += 'Z';
      }
    }
    const date = new Date(value);
    return date.toLocaleString();
  }
}
