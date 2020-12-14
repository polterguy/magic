
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { Message, Messages } from 'src/app/models/message.model';
import { SqlService } from 'src/app/services/sql.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Model class for CodeMirror instance's SQL..
 */
export class Model {

  /**
   * What database type to use (mssql or mysql for instance)
   */
  databaseType: string;

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
}

/**
 * CodeMirror component for allowing user to execute SQL.
 */
@Component({
  selector: 'app-codemirror-sql',
  templateUrl: './codemirror-sql.component.html',
  styleUrls: ['./codemirror-sql.component.scss']
})
export class CodemirrorSqlComponent extends BaseComponent implements OnInit, OnDestroy {

  // Subscription for refresh SQL hints events.
  private subscription: Subscription;

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
  public ngOnInit() {

    // Loading SQL hints, which are tables and fields according to selected database.
    this.loadHints();

    // Subscribing to refresh SQL hints message.
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      switch (msg.name) {

        // Some module signaled we need to refresh SQL hints.
        case Messages.SQL_DATABASE_CHANGED:
          this.loadHints();
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy
   */
  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /*
   * Private helper methods.
   */

  /*
   * Loads SQL hints from backend.
   */
  private loadHints() {

    // Invoking backend passing in database type and database instance.
    this.sqlService.vocabulary(this.model.databaseType, this.model.database).subscribe((result: any) => {

      // Transforming from HTTP result to object(s) expected by CodeMirror.
      const tables = {};
      for (const idxTable of result.databases[0].tables) {
        tables[idxTable.name] = idxTable.columns.map(x => x.name);
      }
      this.model.options.hintOptions = {
        tables: tables
      };
    });
  }
}
