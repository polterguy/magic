
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Search for files component for Hyper IDE, allowing user to filter files, looking for files
 * with specific filenames.
 */
@Component({
  selector: 'app-ide-searchbox',
  templateUrl: './ide-searchbox.component.html',
  styleUrls: ['./ide-searchbox.component.scss']
})
export class IdeSearchboxComponent {

  @Output() filterList = new EventEmitter<any>();
  @Output() toggleFileSystems = new EventEmitter<any>();

  private _inputValue: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public inputValue = this._inputValue.asObservable();

  public fileSystem: boolean;

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
