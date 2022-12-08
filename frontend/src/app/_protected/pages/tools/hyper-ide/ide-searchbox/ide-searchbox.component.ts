import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-ide-searchbox',
  templateUrl: './ide-searchbox.component.html',
  styleUrls: ['./ide-searchbox.component.scss']
})
export class IdeSearchboxComponent implements OnInit {

  @Output() filterList = new EventEmitter<any>();
  @Output() toggleFileSystems = new EventEmitter<any>();
  @Input() type: string;

  private _inputValue: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public inputValue = this._inputValue.asObservable();

  public fileSystem: boolean;

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

  public toggleFileSystem() {
    this.toggleFileSystems.emit(this.fileSystem);
  }
}
