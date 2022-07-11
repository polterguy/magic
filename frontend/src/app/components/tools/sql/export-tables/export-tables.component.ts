
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AfterViewInit, Component, Inject } from '@angular/core';

// Application specific imports.
import { Model } from 'src/app/components/utilities/codemirror/codemirror-sql/codemirror-sql.component';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import fileTypes from 'src/app/codemirror/file-types.json';

/**
 * Model for seeing DDL of tables.
 */
export class ExportTablesModel {
  result: Model;
}

/**
 * Modal window to show result of export tables DDL.
 */
@Component({
  selector: 'app-export-tables',
  templateUrl: './export-tables.component.html',
  styleUrls: ['./export-tables.component.scss']
})
export class ExportTablesComponent implements AfterViewInit {

  // Known file extensions we've got editors for.
  // Used to make sure we reuse default JSON settings for CodeMirror editor.
  private extensions = fileTypes;

  /**
   * CodeMirror options for JSON file types.
   */
  options: any = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ExportTablesModel) { }

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
