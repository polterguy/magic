
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
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
  @Output() button2Click = new EventEmitter();
  @Input() types: string[];
  @Input() type: string;
  @Output() typeChange: EventEmitter<string> = new EventEmitter<string>();
  @Input() checkBoxText: string = null;
  @Input() buttonText: string = null;
  @Input() button2Text: string = null;
  @Input() buttonIcon: string = null;
  @Input() buttonDisabled: boolean = false;
  @Input() button2Disabled: boolean = false;

  filterControl: FormControl;
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
    if (this.type) {
      filter.type = this.type;
    }
    if (this.checkBoxText) {
      filter.checked = this.checked;
    }
    this.filterList.emit(filter);
  }

  typeChanged() {

    this.typeChange?.emit(this.type);
  }

  buttonClicked() {

    this.buttonClick.emit();
  }

  button2Clicked() {

    this.button2Click.emit();
  }
}
