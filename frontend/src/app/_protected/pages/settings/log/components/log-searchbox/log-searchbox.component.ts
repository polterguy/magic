
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-log-searchbox',
  templateUrl: './log-searchbox.component.html'
})
export class LogSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<string>();

  filter: FormControl;

  ngOnInit() {
    this.filter = new FormControl('');
    this.filter.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        this.filterList.emit(query);
      });
  }

  /**
   * Removes the search keyword.
   * @callback filterList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filter.setValue('');
  }
}
