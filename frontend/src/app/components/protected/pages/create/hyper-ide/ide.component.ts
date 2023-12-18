
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, ViewChild } from '@angular/core';
import { FileNode } from './models/file-node.model';
import { IdeSearchboxComponent } from './components/ide-searchbox/ide-searchbox.component';

/**
 * Primary Hyper IDE component, allowing users to browse and edit files.
 */
@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent {

  currentFileData: FileNode;
  searchKey: string;
  @ViewChild('search', {static: true}) search: IdeSearchboxComponent;

  showEditor(event: { currentFileData: any }) {

    this.currentFileData = event.currentFileData;
  }

  filterList(event: any) {

    this.searchKey = event.value;
  }

  focusToFind() {

    this.search.focusToFind();
  }
}
