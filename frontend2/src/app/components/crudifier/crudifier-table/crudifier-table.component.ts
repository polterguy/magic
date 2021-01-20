
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, Input } from '@angular/core';

// Application specific imports.
import { TableEx } from '../models/table-ex.model';

/**
 * Crudifier component for supplying settings and configuration for crudifying a
 * single table.
 */
@Component({
  selector: 'app-crudifier-table',
  templateUrl: './crudifier-table.component.html',
  styleUrls: ['./crudifier-table.component.scss']
})
export class CrudifierTableComponent {

  /**
   * Model for component.
   */
  @Input() public table: TableEx;

  constructor() { }
}
