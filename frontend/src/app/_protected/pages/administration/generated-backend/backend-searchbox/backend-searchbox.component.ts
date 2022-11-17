import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-backend-searchbox',
  templateUrl: './backend-searchbox.component.html',
  styleUrls: ['./backend-searchbox.component.scss']
})
export class BackendSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();

  private _inputValue: ReplaySubject<string>= new ReplaySubject();
  public inputValue = this._inputValue.asObservable();

  constructor() { }

  ngOnInit(): void {

  }

  /**
   * Invoking endpoint to search in unique fields.
   * @params event
   */
   public applyFilter(keyword: string) {
    this._inputValue.next(keyword);
    this.filterList.emit(this._inputValue);
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this._inputValue.next('');
    this.filterList.emit(this._inputValue);
  }

  public toggleSystemEndpoints() {
    this._inputValue.next('');
    this.filterList.emit(this._inputValue);
  }

}
