
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
  @Output() buttonClick = new EventEmitter();
  @Input() types: string[];
  @Input() checkBoxText: string = null;
  @Input() buttonText: string = null;

  filterControl: FormControl;
  selectedType: string = null;
  checked: boolean = false;

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
    if (this.checkBoxText) {
      filter.checked = this.checked;
    }
    this.filterList.emit(filter);
  }

  buttonClicked() {
    this.buttonClick.emit();
  }
}
