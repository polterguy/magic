
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Search textbox for filtering stuff in general.
 */
@Component({
  selector: 'app-searchbox',
  templateUrl: './searchbox.component.html'
})
export class SearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Input() type: string;
  @Input() types: string[];

  filterControl: FormControl;

  installedOnly: boolean = false;
  showSystem: boolean = false;
  selectedType: string = null;

  ngOnInit() {
    this.filterControl = new FormControl('');
    this.filterControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.filter();
      });
  }

  removeSearchTerm() {
    this.filterControl.setValue('');
  }

  filter() {

    const filter: any = {};
    if (this.filterControl.value?.length > 0) {
      filter.searchKey = this.filterControl.value;
    }
    if (this.selectedType) {
      filter.type = this.selectedType;
    }
    if (this.installedOnly) {
      filter.installedOnly = this.installedOnly;
    }
    if (this.showSystem) {
      filter.showSystem = this.showSystem;
    }

    this.filterList.emit(filter);
  }
}
