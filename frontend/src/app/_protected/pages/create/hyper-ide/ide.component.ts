
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { FileNode } from './_models/file-node.model';

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
  searchKey: Observable<string>;

  showEditor(event: { currentFileData: any }) {
    this.currentFileData = event.currentFileData;
  }

  filterList(event: any) {
    this.searchKey = event;
  }
}
