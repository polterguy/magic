
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

/**
 * Model class for CodeMirror instance's SQL..
 */
export class Model {

  /**
   * Two way databound model for editor.
   */
  sql: string;

  /**
   * Options for editor.
   */
  options: any;
}

/**
 * CodeMirror component for allowing user to execute SQL.
 */
@Component({
  selector: 'app-codemirror-sql',
  templateUrl: './codemirror-sql.component.html',
  styleUrls: ['./codemirror-sql.component.scss']
})
export class CodemirrorSqlComponent implements OnInit {

  /**
   * Model for component containing SQL that is displayed.
   */
  @Input() public model: Model;

  constructor() { }

  ngOnInit() {
  }
}
