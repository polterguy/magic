
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';

/**
 * Model for seeing DDL of tables.
 */
export class ExportTablesModel {
  result: string;
  full: boolean;
  module: string;
  type?: string // for tables only ... to be used in the UI.
}

/**
 * Helper component for viewing and optionally exporting DDL for database or table.
 */
@Component({
  selector: 'app-export-ddl',
  templateUrl: './export-ddl.component.html',
  styleUrls: ['./export-ddl.component.scss']
})
export class ExportDdlComponent implements OnInit {

  options: any = null;
  codemirrorReady: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExportTablesModel,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    this.getCodeMirrorOptions();
  }

  /*
   * Private helper methods.
   */

  private getCodeMirrorOptions() {

    const options = this.codemirrorActionsService.getActions(null, 'sql');
    this.options = options;
    setTimeout(() => {
      this.codemirrorInit();
    }, 100);
  }

  private codemirrorInit() {

    this.codemirrorReady = true;
    setTimeout(() => {
      const domNode = (<any>document.querySelector('.CodeMirror'));
      const editor = domNode.CodeMirror;
      editor.doc.markClean();
      editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
    }, 100);
  }
}
