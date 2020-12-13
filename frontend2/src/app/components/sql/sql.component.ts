
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

  // List of items we're viewing details of.
  private displayDetails: any[] = [];

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
   * @param sqlService Needed to be able to execute SQL towards backend
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
      this.displayDetails = [];
      this.result = result;
    }, (error: any) => this.showError(error));
  }

  /**
   * Returns row declarations.
   */
  public getRows() {
    const result = [];
    for (const idx of this.result) {
      result.push(idx);
      if (this.displayDetails.indexOf(idx) !== -1) {
        let colSpan = 0;
        for (const idx in this.result[0]) {
          colSpan += 1;
        }
        result.push({
          _detailsColSpan: Math.min(5, colSpan),
          data: idx,
        })
      }
    }
    return result;
  }

  /**
   * Invoked when user wants to toggle details for a row
   * 
   * @param row Row to toggle details for
   */
  public toggleDetails(row: any[]) {
    const index = this.displayDetails.indexOf(row);
    if (index === -1) {
      this.displayDetails.push(row);
    } else {
      this.displayDetails.splice(index, 1);
    }
  }

  /**
   * Returns true if we're currently viewing details of the specified row.
   * 
   * @param row Row to check
   */
  public viewingDetails(row: any[]) {
    return this.displayDetails.indexOf(row) !== -1;
  }
}
