
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Search textbox for log items.
 */
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

  public removeSearchTerm() {
    this.filter.setValue('');
  }
}
