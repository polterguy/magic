
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Helper component for searching through tasks for tasks starting with the specified filter.
 */
@Component({
  selector: 'app-task-searchbox',
  templateUrl: './task-searchbox.component.html'
})
export class TaskSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Output() addTask = new EventEmitter<any>();

  filterControl: FormControl;

  ngOnInit(): void {
    this.filterControl = new FormControl('');
    this.filterControl.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged())
      .subscribe((query: string) => {
        if (query.length > 2) {
          this.applyFilter(query);
        }
        if (query.length === 0) {
          this.applyFilter('');
        }
      });
  }

  removeSearchTerm() {
    this.filterControl.setValue('');
  }

  invokeAddTask() {
    this.addTask.emit();
  }

  /*
   * Private helper methods.
   */

  private applyFilter(keyword: string) {
    this.filterList.emit(keyword);
  }
}
