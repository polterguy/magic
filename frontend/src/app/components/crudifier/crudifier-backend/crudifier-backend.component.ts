
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular specific imports.
import { forkJoin, Observable } from 'rxjs';
import { formatNumber } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Component, ComponentFactoryResolver, Inject, LOCALE_ID, OnInit } from '@angular/core';

// Application specific imports.
import { TableEx } from '../models/table-ex.model';
import { LocResult } from '../models/loc-result.model';
import { Messages } from 'src/app/models/messages.model';
import { DatabaseEx } from '../models/database-ex.model';
import { SqlService } from '../../sql/services/sql.service';
import { LogService } from '../../log/services/log.service';
import { Databases } from '../../sql/models/databases.model';
import { CrudifyService } from '../services/crudify.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';
import { LoaderInterceptor } from '../../app/services/loader.interceptor';
import { TransformModelService } from '../services/transform-model.service';
import { DefaultDatabaseType } from '../../config/models/default-database-type.model';
import { CrudifierTableComponent } from './crudifier-table/crudifier-table.component';
import { CacheService } from '../../diagnostics/diagnostics-cache/services/cache.service';
import { CrudifierSetDefaultsComponent } from './crudifier-set-defaults/crudifier-set-defaults.component';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Crudifier component for crudifying database
 * tables and generate a backend.
 */
@Component({
  selector: 'app-crudifier-backend',
  templateUrl: './crudifier-backend.component.html'
})
export class CrudifierBackendComponent implements OnInit {

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
   * @param dialog Needed to be able to open modal dialogs
   * @param sqlService Needed to retrieve meta information about databases from backend
   * @param cacheService Needed to delete cache items from backend
   * @param configService Needed to retrieve meta information about connection strings from backend
   * @param crudifyService Needed to actually crudify endpoints
   * @param messageService Needed to signal other components that we've create an additional info type of component that needs to be injected
   * @param feedbackService Needed to display feedback to user
   * @param locale Needed to display numbers in user's locale
   * @param resolver Needed to be able to dynamically create additional components
   * @param loaderInterceptor Needed to hide Ajax loader GIF in case an error occurs
   * @param transformService Needed to transform from UI model to required backend model
   */
  constructor(
    private logService: LogService,
    private dialog: MatDialog,
    private sqlService: SqlService,
    public authService: AuthService,
    private cacheService: CacheService,
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    @Inject(LOCALE_ID) public locale: string,
    private resolver: ComponentFactoryResolver,
    private loaderInterceptor: LoaderInterceptor,
    private transformService: TransformModelService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Retrieving default database type from backend.
    this.sqlService.defaultDatabaseType().subscribe((defaultDatabaseType: DefaultDatabaseType) => {

      // Assigning database types to model.
      this.databaseTypes = defaultDatabaseType.options;
      this.databaseType = this.databaseTypes.filter(x => x === defaultDatabaseType.default)[0];

      // Retrieving connection strings for default database type.
      this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {

        // Assigning default model options
        this.connectionStrings = connectionStrings;
        this.connectionString = this.connectionStrings.filter(x => x === 'generic')[0];
        this.connectionStringChanged();

      });
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user selects a database type.
   */
  public databaseTypeChanged() {

    // Resetting currently selected models for fields.
    this.connectionStrings = [];
    this.connectionString = null;
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

    // Making sure parent clears it dynamic container.
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
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

    // Making sure parent clears it dynamic container.
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
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

    // Making sure parent clears it dynamic container.
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });
  }

  /**
   * Invoked when table is changed.
   */
  public tableChanged() {

    // Making sure parent clears it dynamic container in case it's already got another container.
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });

    // Creating our component.
    const componentFactory = this.resolver.resolveComponentFactory(CrudifierTableComponent);

    // Signaling listener, passing in component as data.
    this.messageService.sendMessage({
      name: Messages.INJECT_COMPONENT,
      content: {
        componentFactory,
        data: {
          table: this.table,
          database: '[' + this.connectionString + '|' + this.database.name + ']',
          databaseType: this.databaseType,
          currentDatabase: this.database,
        }
      }
    });
  }

  /**
   * Empties server side cache and reloads your database declarations,
   * 'refreshing' your available databases.
   */
   public refresh() {

    // Asking user to confirm action, since it reloads page.
    // A bit 'dirty' but simplifies code significantly.
    this.feedbackService.confirm(
      'Confirm action',
      'This will flush your server side cache and reload your page. Are you sure you want to do this?',
      () => {

        // Invoking backend to empty database meta data cache entry.
        this.cacheService.delete('magic.sql.databases.*').subscribe(() => {

          // Reloading database meta declarations now.
          // A bit 'dirty' but simplifies code significantly.
          window.location.href = window.location.href;

        }, (error: any) => this.feedbackService.showError(error));
    });
  }

  /**
   * Invoked when user wants to crudify all tables in currently selected database.
   */
  public crudifyAll() {

    // Creating an array of observables from each table/verb combination we've got.
    const subscribers: Observable<LocResult>[] = [];
    for (const idxTable of this.database.tables || []) {
      const tmp = (idxTable.verbs || []).filter(x => x.generate).map(x => {
        return this.crudifyService.crudify(
          this.transformService.transform(
            this.databaseType,
            '[' + this.connectionString + '|' + this.database.name + ']',
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
      this.logService.createLocItem(loc, 'backend', `${this.database.name}`).subscribe(() => {

        // Showing user some feedback information.
        this.feedbackService.showInfo(`${formatNumber(loc, this.locale, '1.0')} lines of code generated`);

      }, (error: any) => this.feedbackService.showError(error));

    }, (error: any) => {
      this.loaderInterceptor.forceHide();
      this.feedbackService.showError(error);
    });
  }

  public hasWarnings(el: TableEx) {
    for (const idx of el.columns) {
      if (idx.warning) {
        return true;
      }
    }
    return false;
  }

  /**
   * Invoked when user wants to apply default settings that are applied for all tables
   * in currently selected database.
   */
  public setDefaults() {

    // Opening up modal dialog passing in reference default values.
    let dialogRef = this.dialog.open(CrudifierSetDefaultsComponent, {
      width: '550px',
      data: {
        authCreate: 'root, admin',
        authRead: 'root, admin',
        authUpdate: 'root, admin',
        authDelete: 'root, admin',
        primaryUrl: this.database.name,
        logCreate: false,
        logUpdate: false,
        logDelete: false,
      },
    });

    // Subscribing to afterClose such that we can apply defaults if user clicks apply button.
    dialogRef.afterClosed().subscribe((model: any) => {

      // Checking if user wants to apply default settings to all tables.
      if (model) {

        // Applying default values.
        for (const idxTable of this.database.tables) {
          idxTable.moduleName = model.primaryUrl;
          idxTable.authPost = model.authCreate;
          idxTable.authGet = model.authRead;
          idxTable.authPut = model.authUpdate;
          idxTable.authDelete = model.authDelete;
          idxTable.logPost = model.logCreate;
          idxTable.logPut = model.logUpdate;
          idxTable.logDelete = model.logDelete;
        }

        // Providing feedback to user.
        this.feedbackService.showInfoShort('Default values were applied');
      }
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
    for (const idxTable of database.tables || []) {

      // Figuring out if table has foreign keys.
      for (const idx of idxTable.columns) {
        const keys = idxTable.foreign_keys?.filter(x => x.column === idx.name) ?? [];
        if (keys.length > 0) {
          let shouldCreateForeignKey = false;
          const foreignTable = database.tables.filter(x => x.name === keys[0].foreign_table)[0];
          for (const idxCol of foreignTable.columns) {
            if (idxCol.hl === 'string') {
              shouldCreateForeignKey = true;
              break;
            }
          }
          if (shouldCreateForeignKey) {
            idx.foreign_key = {
              foreign_table: keys[0].foreign_table,
              foreign_column: keys[0].foreign_column,
              long_data: true,
              foreign_name: database.tables
                .filter(x => x.name === keys[0].foreign_table)[0].columns.filter(x => x.hl === 'string')[0].name,
            };
          }
        }
      }

      // Creating defaults for currently iterated table.
      idxTable.moduleName = database.name;
      idxTable.moduleUrl = idxTable.name.replace('.', '/').replace('dbo/', '');
      const columns = (idxTable.columns || []);
      idxTable.verbs = [
        { name: 'post', generate: columns.length > 0 },
        { name: 'get', generate: columns.length > 0 },
      ];
      if (columns.filter(x => !x.primary).length > 0 &&
        columns.filter(x => x.primary).length > 0) {
        idxTable.verbs.push({ name: 'put', generate: columns.filter(x => !x.primary && !x.automatic).length > 0 });
      }
      if (columns.filter(x => x.primary).length > 0) {
        idxTable.verbs.push({ name: 'delete', generate: true });
      }

      // Creating default authentication requirements to invoke endpoint(s).
      idxTable.authPost = 'root, admin';
      idxTable.authGet = 'root, admin';
      idxTable.authPut = 'root, admin';
      idxTable.authDelete = 'root, admin';

      // Defaulting CQRS fields to sane values.
      idxTable.cqrsAuthorisation = 'inherited';
      idxTable.cqrsAuthorisationValues = null;

      // Creating defaults for fields in table.
      for (const idxColumn of columns) {

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

        /*
         * Notice, if we're not sure whether or not column should be a part of POST and PUT
         * we expand the column by default, to give visual clues to the user that he needs to
         * pay particular attention to this column, and attach a warning with the column.
         */
        if (idxColumn.automatic && !idxColumn.primary) {
          idxColumn.expanded = true;
          idxColumn.warning = 'Warning, I could not determine with certainty if this column should be included in your create and update endpoints. Please carefully look at it and decide for yourself.';
        }

        /*
         * If column is a foreign key, we also warn the user such that he can associate it with the
         * correct field in the foreign table.
         */
        if (idxColumn.foreign_key) {
          idxColumn.expanded = true;
          if (idxColumn.warning) {
            idxColumn.warning += ' ';
          } else {
            idxColumn.warning = '';
          }
          idxColumn.warning += 'You need to make sure this column is associated with the correct value field in the referenced table.';
        }
      }
    }
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns all connection strings for database type from backend.
   */
  private getConnectionStrings(databaseType: string, onAfter: (connectionStrings: string[]) => void) {

    // Retrieving connection strings for default database type from backend.
    this.sqlService.connectionStrings(databaseType).subscribe((connectionStrings: any) => {

      // Checking if caller supplied a callback, and if so, invoking it.
      if (onAfter) {

        // Transforming backend's result to a list of strings.
        const tmp: string[] = [];
        for (var idx in connectionStrings) {
          tmp.push(idx);
        }
        onAfter(tmp);
      }

    }, (error: any) => {

      // Oops, showing user some feedback
      this.feedbackService.showError(error);}
    );
  }
}
