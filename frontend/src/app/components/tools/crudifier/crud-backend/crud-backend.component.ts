
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
import { LogService } from 'src/app/services/log.service';
import { Databases } from 'src/app/models/databases.model';
import { CrudifyService } from '../services/crudify.service';
import { CacheService } from 'src/app/services/cache.service';
import { SqlService } from '../../../../services/sql.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { TransformModelService } from '../services/transform-model.service';
import { CrudifierTableComponent } from './crud-table/crud-table.component';
import { LoaderInterceptor } from 'src/app/interceptors/loader.interceptor';
import { DefaultDatabaseType } from '../../../../models/default-database-type.model';
import { CrudifierSetDefaultsComponent } from './set-defaults/crudifier-set-defaults.component';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Crudifier component for crudifying database
 * tables and generate a backend.
 */
@Component({
  selector: 'app-crud-backend',
  templateUrl: './crud-backend.component.html'
})
export class CrudBackendComponent implements OnInit {

  /**
   * Options user has for selecting database types.
   */
  databaseTypes: string[] = [];

  /**
   * What database type user has selected.
   */
  databaseType: string = null;

  /**
   * What connection strings user has for selected database type.
   */
  connectionStrings: string[] = [];

  /**
   * What connection string user has selected.
   */
  connectionString: string = null;

  /**
   * What databases user can select.
   */
  databases: Databases = null;

  /**
   * What database user has selected.
   */
  database: DatabaseEx = null;

  /**
   * What table user has selected.
   */
  table: TableEx = null;

  public preDefinedDbName: string = '';

  /**
   * Creates an instance of your component.
   *
   * @param logService Needed to be able to log LOC generated
   * @param dialog Needed to be able to open modal dialogs
   * @param sqlService Needed to retrieve meta information about databases from backend
   * @param crudifyService Needed to actually crudify endpoints
   * @param messageService Needed to signal other components that we've create an additional info type of component that needs to be injected
   * @param feedbackService Needed to display feedback to user
   * @param locale Needed to display numbers in user's locale
   * @param resolver Needed to be able to dynamically create additional components
   * @param loaderInterceptor Needed to hide Ajax loader GIF in case an error occurs
   * @param transformService Needed to transform from UI model to required backend model
   * @param cacheService Needed to be able to purge cache
   * @param router Needed to figure out activated route
   * @param backendService Needed to be able to determine user's access rights in backend
   */
  constructor(
    private logService: LogService,
    private dialog: MatDialog,
    private sqlService: SqlService,
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    @Inject(LOCALE_ID) public locale: string,
    private resolver: ComponentFactoryResolver,
    private loaderInterceptor: LoaderInterceptor,
    protected transformService: TransformModelService,
    private cacheService: CacheService,
    private router: Router,
    public backendService: BackendService,
    private activatedRoute: ActivatedRoute) {
      this.activatedRoute.queryParams.subscribe((params: any) => {
        this.preDefinedDbName = params['db'];
      });
    }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    // Purging server side database cache in case user just recently created a new database.
    this.cacheService.delete('magic.sql.databases.*').subscribe({
      next: () => console.log('Your database cache was purged server side'),
      error: (error: any) => this.feedbackService.showError(error)});

    this.sqlService.defaultDatabaseType().subscribe({
      next: (defaultDatabaseType: DefaultDatabaseType) => {
        this.databaseTypes = defaultDatabaseType.options;
        this.databaseType = this.databaseTypes.filter(x => x === defaultDatabaseType.default)[0];
        this.getConnectionStrings(defaultDatabaseType.default, (connectionStrings: string[]) => {
          this.connectionStrings = connectionStrings;
          this.connectionString = this.connectionStrings.filter(x => x === 'generic')[0];
          this.connectionStringChanged();
        });
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns humanly readable type of database to caller.
   *
   * @param type Type delaration
   */
  getDatabaseTypeName(type: string) {
    switch (type) {
      case 'mysql': return 'MySQL';
      case 'sqlite': return 'SQLite';
      case 'pgsql': return 'PostgreSQL';
      case 'mssql': return 'SQL Server';
    }
  }

  /**
   * Invoked when user selects a database type.
   */
  databaseTypeChanged() {
    this.connectionStrings = [];
    this.connectionString = null;
    this.database = null;
    this.table = null;

    this.sqlService.connectionStrings(this.databaseType).subscribe({
      next: (result: any) => {
        const connectionStrings: string[] = [];
        for (const idx in result) {
          connectionStrings.push(idx);
        }
        this.connectionStrings = connectionStrings;
      },
      error: (error: any) => this.feedbackService.showError(error)});
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });
  }

  /**
   * Invoked when user selects a connection string.
   */
  connectionStringChanged() {
    this.database = null;
    this.table = null;
    this.sqlService.getDatabaseMetaInfo(
      this.databaseType,
      this.connectionString).subscribe({
        next: (databases: Databases) => {
          this.databases = databases;
          if (this.preDefinedDbName !== '') {
            this.database = <any>this.databases.databases.find((item: any) => item.name === this.preDefinedDbName)
            this.createDefaultOptionsForDatabase(this.database);
          }
        },
        error: (error: any) => this.feedbackService.showError(error)});
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });
  }

  /**
   * Invoked when user selects a database.
   */
  databaseChanged() {
    this.table = null;
    this.createDefaultOptionsForDatabase(this.database);
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });
  }

  /**
   * Invoked when CSS class for database name is to be returned.
   *
   * @param db Database name
   */
  getDatabaseCssClass(db: string) {
    switch (this.databaseType) {

      case 'mysql':
        switch (db) {
          case 'information_schema':
          case 'mysql':
          case 'performance_schema':
          case 'sys':
            return 'sys-database';
          default:
            return '';
        }

      case 'pgsql':
        switch (db) {
          case 'postgres':
          case 'template0':
          case 'template1':
          case 'template_postgis':
            return 'sys-database';
          default:
            return '';
        }

      case 'mssql':
        switch (db) {
          case 'master':
          case 'msdb':
          case 'model':
          case 'Resource':
          case 'tempdb':
            return 'sys-database';
          default:
            return '';
        }

      default:
        return '';
    }
  }

  /**
   * Invoked when table is changed.
   */
  tableChanged() {
    this.messageService.sendMessage({
      name: Messages.CLEAR_COMPONENTS,
    });
    const componentFactory = this.resolver.resolveComponentFactory(CrudifierTableComponent);
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
  refresh() {
    this.feedbackService.confirm(
      'Confirm action',
      'This will purge your server side cache and reload your page. Are you sure you want to do this?',
      () => {
        this.cacheService.delete('magic.sql.databases.*').subscribe({
          next: () => window.location.href = window.location.href,
          error: (error: any) => this.feedbackService.showError(error)});
    });
  }

  /**
   * Invoked when user wants to crudify all tables in currently selected database.
   */
  crudifyAll() {
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

    forkJoin(subscribers).subscribe({
      next: (results: LocResult[]) => {
        const loc = results.reduce((x,y) => x + y.loc, 0);
        this.logService.createLocItem(loc, 'backend', `${this.database.name}`).subscribe({
          next: () => {
            this.feedbackService.showInfo(`${formatNumber(loc, this.locale, '1.0')} lines of code generated`);
            this.flushEndpointsAuthRequirements();
            this.messageService.sendMessage({
              name: 'magic.folders.update',
              content: '/modules/'
            });
            if (this.router.url?.startsWith('/crud-generator')) {
              this.messageService.sendMessage({
                name: 'magic.crud-generator.activate-frontend'
              });
            }
          },
          error: (error: any) => this.feedbackService.showError(error)});

      },
      error: (error: any) => {
        this.loaderInterceptor.forceHide();
        this.feedbackService.showError(error);
      }});
  }

  /**
   * Returns true if table has warnings.
   *
   * @param el Table to check
   * @returns True if table has warnings
   */
  hasWarnings(el: TableEx) {
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
  setDefaults() {
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
    dialogRef.afterClosed().subscribe((model: any) => {
      if (model) {
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
        this.feedbackService.showInfoShort('Default values were applied');
      }
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates default crudify options for current database.
   */
  private createDefaultOptionsForDatabase(database: DatabaseEx) {
    for (const idxTable of database.tables || []) {
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

      idxTable.authPost = 'root, admin';
      idxTable.authGet = 'root, admin';
      idxTable.authPut = 'root, admin';
      idxTable.authDelete = 'root, admin';

      idxTable.cqrsAuthorisation = 'inherited';
      idxTable.cqrsAuthorisationValues = null;

      for (const idxColumn of columns) {

        idxColumn.expanded = false;

        idxColumn.post = !(idxColumn.automatic && idxColumn.primary);
        idxColumn.get = true;
        idxColumn.put = !idxColumn.automatic || idxColumn.primary;
        idxColumn.delete = idxColumn.primary;

        idxColumn.postDisabled = false; // idxColumn.primary && !idxColumn.automatic;
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
   * Returns all connection strings for database type from backend.
   */
  private getConnectionStrings(databaseType: string, onAfter: (connectionStrings: string[]) => void) {
    this.sqlService.connectionStrings(databaseType).subscribe({
      next: (connectionStrings: any) => {
        if (onAfter) {
          const tmp: string[] = [];
          for (var idx in connectionStrings) {
            tmp.push(idx);
          }
          onAfter(tmp);
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /*
   * Will flush server side cache of endpoints (auth invocations) and re-retrieve these again.
   */
  private flushEndpointsAuthRequirements() {
    this.cacheService.delete('magic.auth.endpoints').subscribe({
      next: () => this.backendService.refetchEndpoints(),
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
