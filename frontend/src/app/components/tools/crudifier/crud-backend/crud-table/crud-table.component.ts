
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */
import { forkJoin } from 'rxjs';
import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Application specific imports.
import { TableEx } from '../../models/table-ex.model';
import { ColumnEx } from '../../models/column-ex.model';
import { LocResult } from '../../../../../_protected/pages/crud-generator/_models/loc-result.model';
import { LogService } from 'src/app/_protected/pages/log/_services/log.service';
import { DatabaseEx } from '../../models/database-ex.model';
import { CacheService } from 'src/app/services/cache.service';
import { CrudifyService } from '../../../../../_protected/pages/crud-generator/_services/crudify.service';
import { BackendService } from 'src/app/services/backend.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LoaderInterceptor } from 'src/app/interceptors/loader.interceptor';
import { TransformModelService } from '../../services/transform-model.service';
import { Model } from 'src/app/components/utilities/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../../../../utilities/codemirror/options/hyperlambda.json';

/**
 * Crudifier component for supplying settings and configuration
 * for crudifying a single table.
 */
@Component({
  selector: 'app-crud-table',
  templateUrl: './crud-table.component.html',
  styleUrls: ['./crud-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('0.75s cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class CrudifierTableComponent implements OnInit {

  /**
   * Input Hyperlambda component model and options.
   */
  input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Columns for our field/columns table.
   */
  displayedColumns: string[] = [
    'name',
    'db',
    'hl',
    'nullable',
    'primary',
    'automatic',
  ];

  /**
   * Authorisation requirements for SignalR messages published during invocation of endpoint.
   */
  cqrsAuthorisationTypes: string[] = ['none', 'inherited', 'roles', 'groups', 'users'];

  /**
   * Foreign key declarations.
   */
  foreignKeys: any = {};

  /**
   * Model for component wrapping table.
   */
  @Input() table: TableEx;

  /**
   * Model for component wrapping database name.
   */
  @Input() database: string;

  /**
   * Model for component wrapping database, needed to retrieve foreign key table's columns.
   */
  @Input() currentDatabase: DatabaseEx;

  /**
   * Model for component wrapping database type.
   */
  @Input() databaseType: string;

  /**
   * Creates an instance of your component.
   *
   * @param logService Needed to be able to log LOC generated
   * @param cacheService Needed to be able to flush server side cache once crudification is done
   * @param backendService Needed to able to refetch endpoints after crudification of table
   * @param crudifyService Needed to be able to actually crudify selected table
   * @param messageService Needed to publish messages to other components
   * @param feedbackService Needed to display feedback to user
   * @param loaderInterceptor Needed to hide Ajax loader GIF in case an error occurs
   * @param transformService Needed to transform model to type required by crudify service
   */
  constructor(
    private logService: LogService,
    private cacheService: CacheService,
    private backendService: BackendService,
    private crudifyService: CrudifyService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    private loaderInterceptor: LoaderInterceptor,
    private transformService: TransformModelService) {
    this.input.options.autofocus = false;
  }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    for (const idx of this.table.columns) {
      if (idx.foreign_key) {
        const table = this.currentDatabase.tables.filter(x => x.name === idx.foreign_key.foreign_table)[0];
        this.foreignKeys[idx.name] = table.columns.map(x => {
          return {
            name: table.name.replace('dbo.', '') + '.' + x.name,
            value: x.name,
            type: x.hl,
          };
        });
      }
    }
  }

  /**
   * Returns true if this is the generic/magic database
   */
  isMagicDatabase() {
    return this.database === '[generic|magic]';
  }

  /**
   * Returns true of HTTP verb GET is included for crudification.
   */
  isGetIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'get');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns true of HTTP verb DELETE is included for crudification.
   */
  isDeleteIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'delete');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns true of HTTP verb PUT is included for crudification.
   */
  isPutIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'put');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns true of HTTP verb POST is included for crudification.
   */
  isPostIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'post');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns all verbs that are enabled for table as a whole.
   */
  getEnabledVerbs() {
    return this.table.verbs.filter(x => x.generate);
  }

  /**
   * Returns whether or not the specified HTTP verb is disabled
   * for the specified column.
   *
   * @param verb HTTP verb to check
   * @param column Column to check.
   */
  verbForColumnIsDisabled(verb: string, column: ColumnEx) {
    switch (verb) {

      case 'post':
        return column.postDisabled;

      case 'get':
        return column.getDisabled;

      case 'put':
        return column.putDisabled;

      case 'delete':
        return column.deleteDisabled;
    }
  }

  /**
   * Returns CRUD name for specified verb.
   *
   * @param verb HTTP verb to return CRUD name for
   */
  getCrudNameForVerb(verb: string) {
    switch (verb) {

      case 'post':
        return 'Create';

      case 'get':
        return 'Read';

      case 'put':
        return 'Update';

      case 'delete':
        return 'Delete';
    }
  }

  /**
   * Returns true if endpoint name and module name is valid.
   */
  validModuleComponentName() {
    return /^[a-z0-9_-]+$/i.test(this.table.moduleName) && /^[a-z0-9_-]+[/]{0,1}[a-z0-9_-]*$/i.test(this.table.moduleUrl);
  }

  /**
   * Invoked when user wants to crudify selected table (only).
   */
  crudifyTable() {
    this.table.validators = this.input.hyperlambda;
    const subscribers = this.table.verbs.filter(x => x.generate).map(x => {
      return this.crudifyService.crudify(
        this.transformService.transform(
          this.databaseType,
          this.database,
          this.table,
          x.name));
    });

    forkJoin(subscribers).subscribe({
      next: (results: LocResult[]) => {
        const loc = results.reduce((x,y) => x + y.loc, 0);
        this.logService.createLocItem(loc, 'backend', `${this.database + '.' + this.table.name}`).subscribe({
          next: () => {
            this.feedbackService.showInfo(`${loc} LOC generated`);
            this.flushEndpointsAuthRequirements();
            this.messageService.sendMessage({
              name: 'magic.folders.update',
              content: '/modules/'
            });
          },
          error: (error: any) => this.feedbackService.showError(error)});
      },
      error: (error: any) => {
        this.loaderInterceptor.forceHide();
        this.feedbackService.showError(error);
      }});
  }

  /*
   * Will flush server side cache of endpoints (auth invocations) and re-retrieve these again.
   */
  flushEndpointsAuthRequirements() {
    this.cacheService.delete('magic.auth.endpoints').subscribe({
      next: () => {
        this.backendService.refetchEndpoints();
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
