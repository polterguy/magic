
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

// Application specific imports.
import { TableEx } from '../models/table-ex.model';
import { LocResult } from '../models/loc-result.model';
import { DatabaseEx } from '../models/database-ex.model';
import { SqlService } from '../../sql/services/sql.service';
import { LogService } from '../../log/services/log.service';
import { Databases } from '../../sql/models/databases.model';
import { CrudifyService } from '../services/crudify.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LoaderInterceptor } from '../../app/services/loader.interceptor';
import { TransformModelService } from '../services/transform-model.service';

/**
 * Crudifier component for crudifying database
 * tables and generate a backend.
 */
@Component({
  selector: 'app-crudifier-backend',
  templateUrl: './crudifier-backend.component.html',
  styleUrls: ['./crudifier-backend.component.scss']
})
export class CrudifierBackendComponent {

  /**
   * Options user has for selecting database types.
   */
  public databaseTypes: string[] = [
    'mysql',
    'mssql',
  ];

  /**
   * What database type user has selected.
   */
  public databaseType: string = null;

  /**
   * What connection strings user has for selected database type.
   */
  public connectionStrings: string[] = [];

  /**
   * What connection string user has selected.
   */
  public connectionString: string = null;

  /**
   * What databases user can select.
   */
  public databases: Databases = null;

  /**
   * What database user has selected.
   */
  public database: DatabaseEx = null;

  /**
   * What table user has selected.
   */
  public table: TableEx = null;

  /**
   * Creates an instance of your component.
   * 
   * @param logService Needed to be able to log LOC generated
   * @param sqlService Needed to retrieve meta information about databases from backend
   * @param crudifyService Needed to actually crudify endpoints
   * @param feedbackService Needed to display feedback to user
   * @param loaderInterceptor Needed to hide Ajax loader GIF in case an error occurs
   * @param transformService Needed to transform from UI model to required backend model
   */
  constructor(
    private logService: LogService,
    private sqlService: SqlService,
    private crudifyService: CrudifyService,
    private feedbackService: FeedbackService,
    private loaderInterceptor: LoaderInterceptor,
    private transformService: TransformModelService) { }

  /**
   * Invoked when user selects a database type.
   */
  public databaseTypeChanged() {

    // Resetting currently selected models for fields.
    this.connectionStrings = [];
    this.database = null;
    this.table = null;

    // Invoking backend to retrieve candidates for connection strings.
    this.sqlService.connectionStrings(this.databaseType).subscribe((result: any) => {

      // Assigning result from invocation to model.
      const connectionStrings: string[] = [];
      for (const idx in result) {
        connectionStrings.push(idx);
      }
      this.connectionStrings = connectionStrings;
    });
  }

  /**
   * Invoked when user selects a connection string.
   */
  public connectionStringChanged() {

    // Resetting currently selected models for fields.
    this.database = null;
    this.table = null;

    // Invoking backend to retrieve candidates for databases.
    this.sqlService.getDatabaseMetaInfo(
      this.databaseType,
      this.connectionString).subscribe((databases: Databases) => {

        // Assigning result from invocation to model.
        this.databases = databases;
      });
  }

  /**
   * Invoked when user selects a database.
   */
  public databaseChanged() {

    // Resetting currently selected models for fields.
    this.table = null;

    // Creating default values for database.
    this.createDefaultOptionsForDatabase(this.database);
  }

  /**
   * Invoked when user wants to crudify all tables in currently selected database.
   */
  public crudifyAll() {

    // Creating an array of observables from each table/verb combination we've got.
    const subscribers: Observable<LocResult>[] = [];
    for (const idxTable of this.database.tables) {
      const tmp = idxTable.verbs.filter(x => x.generate).map(x => {
        return this.crudifyService.crudify(
          this.transformService.transform(
            this.databaseType,
            this.database.name,
            idxTable,
            x.name));
      });
      for (const tmpIdx of tmp) {
        subscribers.push(tmpIdx);
      }
    }

    // Invoking backend for each above created observable.
    forkJoin(subscribers).subscribe((results: LocResult[]) => {

      // Providing feedback to user.
      const loc = results.reduce((x,y) => x + y.loc, 0);
      this.feedbackService.showInfo(`${loc} LOC generated`);
      this.logService.createLocItem(loc, 'backend', `${this.database.name}`).subscribe(() => {

        console.log('Logged LOC to backend');

      }, (error: any) => this.feedbackService.showError(error));

    }, (error: any) => {
      this.loaderInterceptor.forceHide();
      this.feedbackService.showError(error);
    });
  }

  /*
   * Private methods.
   */

  /*
   * Creates default crudify options for current database.
   */
  private createDefaultOptionsForDatabase(database: DatabaseEx) {

    // Looping through each table in database.
    for (const idxTable of database.tables) {

      // Creating defaults for currently iterated table.
      idxTable.moduleName = database.name;
      idxTable.moduleUrl = idxTable.name;
      idxTable.verbs = [
        { name: 'post', generate: true },
        { name: 'get', generate: true },
      ];
      if (idxTable.columns.filter(x => !x.primary).length > 0 &&
        idxTable.columns.filter(x => x.primary).length > 0) {
        idxTable.verbs.push({ name: 'put', generate: idxTable.columns.filter(x => !x.primary && !x.automatic).length > 0 });
      }
      if (idxTable.columns.filter(x => x.primary).length > 0) {
        idxTable.verbs.push({ name: 'delete', generate: true });
      }

      // Creating default authentication requirements to invoke endpoint(s).
      idxTable.authPost = 'root';
      idxTable.authGet = 'root';
      idxTable.authPut = 'root';
      idxTable.authDelete = 'root';

      // Creating defaults for fields in table.
      for (const idxColumn of idxTable.columns) {

        // Defaulting expanded to false.
        idxColumn.expanded = false;

        // Defaulting whether or not columns should be included to verb invocations.
        idxColumn.post = !idxColumn.automatic;
        idxColumn.get = true;
        idxColumn.put = !idxColumn.automatic || idxColumn.primary;
        idxColumn.delete = idxColumn.primary;

        // Settings whether or not column can be added/removed from verb invocations.
        idxColumn.postDisabled = idxColumn.primary && !idxColumn.automatic;
        idxColumn.getDisabled = false;
        idxColumn.putDisabled = idxColumn.primary;
        idxColumn.deleteDisabled = true;
      }
    }
  }
}
