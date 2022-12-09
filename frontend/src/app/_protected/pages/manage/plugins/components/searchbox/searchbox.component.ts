
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-searchbox',
  templateUrl: './searchbox.component.html'
})
export class SearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Input() type: string;

  filterControl: FormControl;

  public installedOnly: boolean = false;

  ngOnInit(): void {
    this.filterControl = new FormControl('');
    this.filterControl.valueChanges
      .subscribe((query: string) => {
        this.applyFilter(query);
      });
  }

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
   public applyFilter(keyword: string) {
    this.filter()
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filterControl.setValue('');
  }

  public filter() {
    this.filterList.emit({ installedOnly: this.installedOnly, searchKey: this.filterControl.value });
  }
}
