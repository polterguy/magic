
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import fileTypes from 'src/app/codemirror/file-types.json';

/**
 * Model for migration script.
 */
 export class MigrationScriptModel {
  sql: string;
}

/**
 * Modal dialog for showing user SQL resulting from DDL execution, allowing him to automatically create
 * a migration script for the currently selected database.
 */
@Component({
  selector: 'app-apply-migration',
  templateUrl: './apply-migration.component.html',
  styleUrls: ['./apply-migration.component.scss']
})
export class ApplyMigrationComponent {

  // Known file extensions we've got editors for.
  // Used to make sure we reuse default JSON settings for CodeMirror editor.
  private extensions = fileTypes;

  /**
   * CodeMirror options for SQL.
   */
   options: any = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: MigrationScriptModel) { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.options = this.extensions.filter(x => x.extensions.indexOf('sql') !== -1)[0].options;
    }, 500);
    setTimeout(() => {
      var domNode = (<any>document.querySelector('.CodeMirror'));
      var editor = domNode.CodeMirror;
      editor.doc.markClean();
      editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
    }, 800);
  }
}
