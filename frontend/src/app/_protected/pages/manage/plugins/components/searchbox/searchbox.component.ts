
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

  filterControl: FormControl;

  installedOnly: boolean = false;
  showSystem: boolean = false;

  ngOnInit() {
    this.filterControl = new FormControl('');
    this.filterControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.filterList.emit({
          searchKey: this.filterControl.value
        });
      });
  }

  removeSearchTerm() {
    this.filterControl.setValue('');
  }

  filter() {

    this.filterList.emit({
      installedOnly: this.installedOnly,
      showSystem: this.showSystem,
      searchKey: this.filterControl.value
    });
  }
}
