
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { SqlService } from 'src/app/services/sql.service';
import { MessageService } from 'src/app/services/message.service';

// CodeMirror options.
import sql from '../codemirror/options/sql.json'

/**
 * SQL component allowing user to execute arbitrary SQL statements towards his database.
 */
@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss']
})
export class SqlComponent extends BaseComponent implements OnInit {

  /**
   * SQL model for CodeMirror editor.
   */
  public sql: string;

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    sql: sql,
  };

  /**
   * Result of invocation towards backend.
   */
  public result: any[] = null;

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Message service used to message other components
   */
  constructor(
    private sqlService: SqlService,
    protected messageService: MessageService) {
    super(messageService);
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {
    this.cmOptions.sql.autofocus = true;
  }

  /**
   * Executes the current SQL towards your backend.
   */
  public execute() {

    // Invoking backend.
    this.sqlService.execute('mysql', 'magic', this.sql, true).subscribe((result: any[]) => {

      // Success!
      this.showInfo('SQL successfully executed');
      this.result = result;
    }, (error: any) => this.showError(error));
  }
}
