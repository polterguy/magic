
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/_services/codemirror-actions.service';

/**
 * Model for seeing DDL of tables.
 */
export class ExportTablesModel {
  result: string;
  full: boolean;
  module: string;
  canExport: boolean;
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

  /**
   * CodeMirror options for SQL.
   */
  options: any = null;

  /**
   * If true, CodeMirror instance can be shown.
   */
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

  // Returns CodeMirror options for SQL type.
  private getCodeMirrorOptions() {
    this.codemirrorActionsService.getActions(null, 'sql').then((options: any) => {
      this.options = options;
      setTimeout(() => {
        this.codemirrorInit();
      }, 100);
    });
  }

  // Enables CodeMirror instance, and clears undo history.
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
