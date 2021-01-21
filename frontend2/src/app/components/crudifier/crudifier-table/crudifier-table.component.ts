
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, Input } from '@angular/core';
import { ColumnEx } from '../models/column-ex.model';

// Application specific imports.
import { TableEx } from '../models/table-ex.model';

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
   * Model for component.
   */
  @Input() public table: TableEx;

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
}
