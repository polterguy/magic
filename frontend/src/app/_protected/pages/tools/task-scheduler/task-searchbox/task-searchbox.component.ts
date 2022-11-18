import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-task-searchbox',
  templateUrl: './task-searchbox.component.html',
  styleUrls: ['./task-searchbox.component.scss']
})
export class TaskSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Output() addTask = new EventEmitter<any>();

  filterControl: FormControl;

  constructor() { }

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

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
   private applyFilter(keyword: string) {
    this.filterList.emit(keyword);
  }

  /**
   * Removes the search keyword.
   * @callback filterList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filterControl.setValue('');
  }

  public invokeAddTask() {
    this.addTask.emit();
  }

}
