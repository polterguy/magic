
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Input, OnInit } from '@angular/core';
import { ColumnEx } from 'src/app/models/column-ex.model';

/**
 * Helper component to configure DRUD generator for a single table.
 */
@Component({
  selector: 'app-single-table-config',
  templateUrl: './single-table-config.component.html',
  styleUrls: ['./single-table-config.component.scss']
})
export class SingleTableConfigComponent implements OnInit {

  @Input() selectedTable: string = '';
  @Input() selectedDatabase: string = '';
  @Input() databases: any = [];

  displayedColumns: string[] = [
    'name',
    'type',
    'default',
    'create',
    'read',
    'update',
    'delete'
  ];
  dataSource: any = [];

  public foreign_keys: any[] = [];

  fkLong: any = {}

  ngOnInit() {

    this.watchDbLoading();
  }

  watchDbLoading() {

    this.dataSource = [];
    const db: any = this.databases.find((db: any) => db.name === this.selectedDatabase);
    const table: any = db.tables.find((table: any) => table.name === this.selectedTable.toString());

    this.foreign_keys = table.foreign_keys || [];

    const columns = (table.columns || []);

    this.dataSource = table.columns;

    for (const idxColumn of columns) {

      idxColumn.post = !(idxColumn.automatic && idxColumn.primary);
      if (idxColumn.automatic && idxColumn.name?.toLowerCase() === 'created') {
        idxColumn.post = false;
      }
      idxColumn.get = true;
      idxColumn.put = !idxColumn.automatic || idxColumn.primary;
      idxColumn.delete = idxColumn.primary;

      idxColumn.postDisabled = false;
      idxColumn.getDisabled = false;
      idxColumn.putDisabled = idxColumn.primary;
      idxColumn.deleteDisabled = true;

      if ((idxColumn.name === 'user' || idxColumn.name === 'username') && idxColumn.hl === 'string') {
        idxColumn.locked = true;
      }

      if (idxColumn.name?.toLowerCase() === 'picture' || idxColumn.name?.toLowerCase() === 'image' || idxColumn.name?.toLowerCase() === 'photo') {
        idxColumn.handling = 'image';
      }

      if (idxColumn.name?.toLowerCase() === 'file') {
        idxColumn.handling = 'file';
      }

      if (idxColumn.name?.toLowerCase() === 'youtube' || idxColumn.name?.toLowerCase() === 'video') {
        idxColumn.handling = 'youtube';
      }

      if (idxColumn.name?.toLowerCase() === 'email' || idxColumn.name?.toLowerCase() === 'mail') {
        idxColumn.handling = 'email';
      }

      if (idxColumn.name?.toLowerCase() === 'url' || idxColumn.name?.toLowerCase() === 'link') {
        idxColumn.handling = 'url';
      }

      if (idxColumn.name?.toLowerCase() === 'phone' || idxColumn.name?.toLowerCase() === 'tel') {
        idxColumn.handling = 'phone';
      }
    }
  }

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

  changeTemplate(el: any, item: any) {
    if (item.key === 'locked') {
      el.locked = true;
      delete el.handling;
    } else {
      delete el.locked;
      el.handling = item.key
    }
  }
}
