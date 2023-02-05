
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

  private _inputValue: BehaviorSubject<string> = new BehaviorSubject<string>('');

  @Output() filterList = new EventEmitter<any>();
  @Output() toggleFileSystems = new EventEmitter<any>();

  inputValue = this._inputValue.asObservable();

  fileSystem: boolean;

  applyFilter(keyword: string) {

    this._inputValue.next(keyword);
    this.filterList.emit(this._inputValue);
  }

  removeSearchTerm() {

    this._inputValue.next('');
    this.filterList.emit(this._inputValue);
  }

  toggleFileSystem() {

    this.toggleFileSystems.emit(this.fileSystem);
  }
}
