import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-task-searchbox',
  templateUrl: './task-searchbox.component.html',
  styleUrls: ['./task-searchbox.component.scss']
})
export class TaskSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Output() addTask = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {

  }

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

  public invokeAddTask() {
    this.addTask.emit();
  }

}
