import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-searchbox',
  templateUrl: './searchbox.component.html',
  styleUrls: ['./searchbox.component.scss']
})
export class SearchboxComponent implements OnInit {

  @Input() hasSystemEndpoints: boolean = false;
  @Input() systemEndpointChecked: boolean = false;

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
    this.filterList.emit({searchKey: this._inputValue});
  }

  /**
   * Removes the search keyword.
   * @callback getExportList To refetch the unfiltered list.
   */
  public removeSearchTerm() {
    this._inputValue.next('');
    this.filterList.emit({searchKey: this._inputValue});
  }

  public toggleSystemEndpoints() {
    this._inputValue.next('');
    this.filterList.emit({ defaultListToShow: this.systemEndpointChecked ? 'system' : 'other', searchKey: this._inputValue });
  }
}
