
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { forkJoin } from 'rxjs';
import { Component, Input } from '@angular/core';

// Application specific imports.
import { Crudify } from '../models/crudify.model';
import { TableEx } from '../models/table-ex.model';
import { ColumnEx } from '../models/column-ex.model';
import { LocResult } from '../models/loc-result.model';
import { CrudifyService } from '../services/crudify.service';
import { FeedbackService } from 'src/app/services/feedback.service';

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
   * @param crudifyService Needed to be able to actually crudify selected table
   */
  constructor(
    private crudifyService: CrudifyService,
    private feedbackService: FeedbackService) { }

  /**
   * Returns true of HTTP verb GET is included for crudification.
   */
  public isGetIncluded() {
    return this.table.verbs.filter(x => x.name === 'get')[0].generate;
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
      return this.crudifyService.crudify(this.getCrudifyData(x.name));
    });

    // Invoking backend for each above created observable.
    forkJoin(subscribers).subscribe((results: LocResult[]) => {

      // Providing feedback to user.
      console.log(results);

    }, (error: any) => this.feedbackService.showError(error));
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns crudification configuration for specified HTTP verb.
   */
  private getCrudifyData(verb: string) {

    // Creating arguments for crudification process.
    const result = new Crudify();
    result.databaseType = this.databaseType;
    result.database = this.database;
    result.moduleName = this.table.moduleName;
    result.moduleUrl = this.table.moduleUrl;
    result.table = this.table.name;
    result.verb = verb;
    result.returnId = this.table.columns.filter(x => x.primary && !x.automatic).length === 0;
    result.overwrite = true;

    // Figuring out template to use according to specified HTTP verb.
    switch (verb) {

      case 'post':
        result.template = '/modules/system/crudifier/templates/crud.template.post.hl';
        break;

      case 'get':
        result.template = '/modules/system/crudifier/templates/crud.template.get.hl';
        break;

      case 'put':
        result.template = '/modules/system/crudifier/templates/crud.template.put.hl';
        break;

      case 'delete':
        result.template = '/modules/system/crudifier/templates/crud.template.delete.hl';
        break;

      default:
        throw 'Oops, unknown verb';
    }

    // Figuring out args to use for invocation.
    result.args = {
      columns: [],
      primary: [],
    };
    for (const idxColumn of this.table.columns) {
      switch (verb) {

        case 'post':
          if (idxColumn.post) {
            result.args.columns.push({
              [idxColumn.name]: idxColumn.hl
            });
          }
          break;

        case 'get':
          if (idxColumn.get) {
            result.args.columns.push({
              [idxColumn.name]: idxColumn.hl
            });
          }
          break;

        case 'put':
          if (idxColumn.put) {
            if (idxColumn.primary) {
              result.args.primary.push({
                [idxColumn.name]: idxColumn.hl
              });
            } else {
              result.args.columns.push({
                [idxColumn.name]: idxColumn.hl
              });
            }
          }
          break;

        case 'delete':
          if (idxColumn.delete) {
            if (idxColumn.primary) {
              result.args.primary.push({
                [idxColumn.name]: idxColumn.hl
              });
            }
          }
          break;
      }
    }

    return result;
  }
}
