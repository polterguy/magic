
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
}
