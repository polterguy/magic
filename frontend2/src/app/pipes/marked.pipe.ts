
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

import { Pipe, PipeTransform } from '@angular/core';
import * as marked from "marked";

/**
 * Markdown pipe, transforming Markdown to HTML.
 */
@Pipe({
  name: 'marked'
})
export class MarkedPipe implements PipeTransform {

  /**
   * Transforms Markdown to HTML, and returns to caller.
   * 
   * @param value Markdown to transform to HTML
   */
  transform(value: any): any {
    if (!value || value.length === 0) {
      return '';
    }
    return marked(value);
  }
}
