import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-health-searchbox',
  templateUrl: './health-searchbox.component.html',
  styleUrls: ['./health-searchbox.component.scss']
})
export class HealthSearchboxComponent implements OnInit {

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
