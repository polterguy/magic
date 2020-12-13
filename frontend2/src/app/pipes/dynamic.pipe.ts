
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
   */
  transform(value: any) : any {
    let keys = [];
    for (let key in value) {
      keys.push({key: key, value: value[key]});
    }
    return keys;
  }
}
