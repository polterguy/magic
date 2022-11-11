import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-log-searchbox',
  templateUrl: './log-searchbox.component.html',
  styleUrls: ['./log-searchbox.component.scss']
})
export class LogSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Output() testAll = new EventEmitter<any>();

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

  public invokeTestAll() {
    this.testAll.emit();
  }

}
