import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-socket-searchbox',
  templateUrl: './socket-searchbox.component.html',
  styleUrls: ['./socket-searchbox.component.scss']
})
export class SocketSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();

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
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this.filterList.emit('');
  }

}
