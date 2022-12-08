
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-log-searchbox',
  templateUrl: './log-searchbox.component.html'
})
export class LogSearchboxComponent {

  @Output() filterList = new EventEmitter<any>();
  @Output() errorOnly = new EventEmitter<any>();

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
   public applyFilter(keyword: string) {
    this.filterList.emit(keyword);
  }

  /**
   * Removes the search keyword.
   * @callback filterList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filterList.emit('');
  }

  public toggleShowError(event: any) {
    this.errorOnly.emit(event.checked);
  }
}
