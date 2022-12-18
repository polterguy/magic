
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

/**
 * Filtering text box to allow the user to filter through his test cases.
 */
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-health-searchbox',
  templateUrl: './health-searchbox.component.html',
  styleUrls: ['./health-searchbox.component.scss']
})
export class HealthSearchboxComponent {

  @Output() filterList = new EventEmitter<any>();
  @Output() testAll = new EventEmitter<any>();

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

  public invokeTestAll() {
    this.testAll.emit();
  }
}
