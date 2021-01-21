
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { forkJoin } from 'rxjs';
import { Component, Input } from '@angular/core';

// Application specific imports.
import { TableEx } from '../models/table-ex.model';
import { ColumnEx } from '../models/column-ex.model';
import { LocResult } from '../models/loc-result.model';
import { LogService } from '../../log/services/log.service';
import { CrudifyService } from '../services/crudify.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LoaderInterceptor } from '../../app/services/loader.interceptor';
import { TransformModelService } from '../services/transform-model.service';

/**
 * Crudifier component for supplying settings and configuration
 * for crudifying a single table.
 */
@Component({
  selector: 'app-crudifier-table',
  templateUrl: './crudifier-table.component.html',
  styleUrls: ['./crudifier-table.component.scss']
})
export class CrudifierTableComponent {

  /**
   * Columns for our field/columns table.
   */
  public displayedColumns: string[] = [
    'name',
    'db',
    'hl',
    'nullable',
    'primary',
    'automatic',
  ];

  /**
   * Model for component wrapping table.
   */
  @Input() public table: TableEx;

  /**
   * Model for component wrapping database name.
   */
  @Input() public database: string;

  /**
   * Model for component wrapping database type.
   */
  @Input() public databaseType: string;

  /**
   * Creates an instance of your component.
   * 
   * @param logService Needed to be able to log LOC generated
   * @param crudifyService Needed to be able to actually crudify selected table
   * @param feedbackService Needed to display feedback to user
   * @param loaderInterceptor Needed to hide Ajax loader GIF in case an error occurs
   * @param transformService Needed to transform model to type required by crudify service
   */
  constructor(
    private logService: LogService,
    private crudifyService: CrudifyService,
    private feedbackService: FeedbackService,
    private loaderInterceptor: LoaderInterceptor,
    private transformService: TransformModelService) { }

  /**
   * Returns true of HTTP verb GET is included for crudification.
   */
  public isGetIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'get');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns true of HTTP verb DELETE is included for crudification.
   */
  public isDeleteIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'delete');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns true of HTTP verb PUT is included for crudification.
   */
  public isPutIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'put');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns true of HTTP verb POST is included for crudification.
   */
  public isPostIncluded() {
    const verbs = this.table.verbs.filter(x => x.name === 'post');
    if (verbs.length === 0) {
      return false;
    }
    return verbs[0].generate;
  }

  /**
   * Returns all verbs that are enabled for table as a whole.
   */
  public getEnabledVerbs() {
    return this.table.verbs.filter(x => x.generate);
  }

  /**
   * Returns whether or not the specified HTTP verb is disabled
   * for the specified column.
   * 
   * @param verb HTTP verb to check
   * @param column Column to check.
   */
  public verbForColumnIsDisabled(verb: string, column: ColumnEx) {
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
  public getCrudNameForVerb(verb: string) {
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
   * Invoked when user wants to crudify selected table (only).
   */
  public crudifyTable() {

    // Creating observables for each enabled HTTP verb.
    const subscribers = this.table.verbs.filter(x => x.generate).map(x => {
      return this.crudifyService.crudify(
        this.transformService.transform(
          this.databaseType,
          this.database,
          this.table,
          x.name));
    });

    // Invoking backend for each above created observable.
    forkJoin(subscribers).subscribe((results: LocResult[]) => {

      // Providing feedback to user.
      const loc = results.reduce((x,y) => x + y.loc, 0);

      // Logging items to backend, and once done, showing user some feedback information.
      this.logService.createLocItem(loc, 'backend', `${this.database + '.' + this.table.name}`).subscribe(
        () => this.feedbackService.showInfo(`${loc} LOC generated`),
        (error: any) => this.feedbackService.showError(error));

    }, (error: any) => {
      this.loaderInterceptor.forceHide();
      this.feedbackService.showError(error);
    });
  }
}
