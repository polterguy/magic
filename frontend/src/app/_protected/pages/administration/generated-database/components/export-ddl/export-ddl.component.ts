import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import fileTypes from 'src/app/codemirror/file-types.json';

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

@Component({
  selector: 'app-export-ddl',
  templateUrl: './export-ddl.component.html',
  styleUrls: ['./export-ddl.component.scss']
})
export class ExportDdlComponent implements OnInit {

  // Known file extensions we've got editors for.
  // Used to make sure we reuse default JSON settings for CodeMirror editor.
  private extensions = fileTypes;

  /**
   * CodeMirror options for SQL.
   */
  options: any = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExportTablesModel) { }

  ngOnInit(): void {
    this.getOptions();
  }

  private getOptions() {
    (async () => {
      while (!(this.extensions || this.extensions.length))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.extensions && this.extensions.length) {
        this.options = this.extensions.filter(x => x.extensions.indexOf('sql') !== -1)[0].options;
        this.codemirrorInit();
      }
    })();
  }

  private codemirrorInit() {
    (async () => {
      while (!(document.querySelector('.CodeMirror')))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (document.querySelector('.CodeMirror')) {
        const domNode = (<any>document.querySelector('.CodeMirror'));
        const editor = domNode.CodeMirror;
        editor.doc.markClean();
        editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
      }
    })();
  }

}
