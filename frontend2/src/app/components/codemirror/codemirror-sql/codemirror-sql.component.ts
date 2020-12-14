
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { SqlService } from 'src/app/services/sql.service';
import { MessageService } from 'src/app/services/message.service';

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
export class CodemirrorSqlComponent extends BaseComponent implements OnInit {

  /**
   * Model for component containing SQL that is displayed.
   */
  @Input() public model: Model;

  /**
   * Creates an instance of your component.
   * 
   * @param sqlService Necessary to retrieve auto complete object
   * @param messageService Used to signal other components
   */
  constructor(
    private sqlService: SqlService,
    protected messageService: MessageService) {
      super(messageService);
  }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.loadHints();
  }

  /*
   * Private helper methods.
   */

  /*
   * Loads SQL hints from backend.
   */
  private loadHints() {
    this.sqlService.vocabulary('mysql', 'magic').subscribe((result: any) => {
      const tmpHints = {};
      for (const idxDb of result.databases) {
        for (const idxTable of idxDb.tables) {
          const name = idxTable.name;
          const columns = idxTable.columns.map((x: any) => x.name);
          tmpHints[name] = columns;
        }
      }
      this.model.options.hintOptions.tables = tmpHints;
      console.log(this.model);
    });
  }
}
