
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Output } from '@angular/core';

/**
 * Filtering textbox for searching through socket messages as published by the backend.
 */
@Component({
  selector: 'app-socket-searchbox',
  templateUrl: './socket-searchbox.component.html'
})
export class SocketSearchboxComponent {

  @Output() filterList = new EventEmitter<any>();

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
  public applyFilter(keyword: string) {
    this.filterList.emit(keyword);
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filterList.emit('');
  }
}
