
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
  styleUrls: ['./codemirror-sql.component.scss']
})
export class CodemirrorSqlComponent implements AfterViewInit {

  // Actual CodeMirror instance, needed to retrieve selected text.
  @ViewChild('codeeditor') private _editor: { codeMirror: any; };

  /**
   * Model for component containing SQL that is displayed.
   */
  @Input() public model: Model;

  /**
   * Creates an instance of your component.
   */
  constructor() { }

  /**
   * Implementation of AfterViewInit
   */
  public ngAfterViewInit() {
    this.model.editor = this._editor.codeMirror;
  }
}
