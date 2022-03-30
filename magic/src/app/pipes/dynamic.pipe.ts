
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Dynamic pipe allowing you to traverse object keys and values.
 */
@Pipe({
  name: 'dynamic'
})
export class DynamicPipe implements PipeTransform {

  /**
   * Transforms an object to a key/value pair
   * 
   * @param value Value to transform
   * @param max Optional maximum number of items to return
   */
  transform(value: any, max: number = -1) : any {
    const keys = [];
    for (const key in value) {
      if (keys.length === max) {
        break;
      }
      keys.push({key: key, value: value[key]});
    }
    return keys;
  }
}
