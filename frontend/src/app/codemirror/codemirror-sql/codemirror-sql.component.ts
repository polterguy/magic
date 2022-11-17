
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';

/**
 * Model class for CodeMirror instance's SQL..
 */
export class Model {

  /**
   * What database type to use (mssql or mysql for instance)
   */
  databaseType: string;

  /**
   * What connection string to use, typically for instance 'generic' or some other
   * connection string that is configured in your backend.
   */
  connectionString: string;

  /**
   * What database connection string to use (e.g. '[generic|magic]').
   */
  database: string;

  /**
   * Two way databound model for editor.
   */
  sql: string;

  /**
   * Options for editor.
   */
  options: any;

  /**
   * Actual CodeMirror instance, useful for determining selected text, etc.
   */
  editor?: any;
}

/**
 * CodeMirror component for allowing user to execute SQL.
 */
@Component({
  selector: 'app-codemirror-sql',
  templateUrl: './codemirror-sql.component.html',
})
export class CodemirrorSqlComponent implements AfterViewInit {

  // Actual CodeMirror instance, needed to retrieve selected text.
  @ViewChild('codeeditor') private _editor: { codeMirror: any; };

  /**
   * Model for component containing SQL that is displayed.
   */
  @Input() public model: Model;

  /**
   * Implementation of AfterViewInit
   */
  public ngAfterViewInit() {
    (async () => {
      while (!(this._editor && this._editor.codeMirror))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this._editor && this._editor.codeMirror) {
        this.model.editor = this._editor.codeMirror;

        this.model.editor.doc.markClean();
        this.model.editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
      }
    })();
  }
}
