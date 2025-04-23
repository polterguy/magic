
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';

interface FKData {
  databases: any,
  selectedDatabase: string,
  selectedTable: any,
  foreign_keys: any,
  currentForeignKey?: any,
  columnName: string,
  long_data?: boolean
}

export interface FKModel {
  foreign_table: string,
  foreign_column: string,
  foreign_name: string,
  long_data: boolean
}

/**
 * Popup that display all possibly foreign key string references, allowing user to select how to display
 * foreign key.
 */
@Component({
  selector: 'app-foreign-key-list',
  templateUrl: './foreign-key-list.component.html',
  styleUrls: ['./foreign-key-list.component.scss']
})
export class ForeignKeyListComponent implements AfterViewInit {

  @Input() data: FKData;
  @Output() changeForeignKey = new EventEmitter<any>();

  public fkList: any = [];

  public foreignKey: string[] = [];

  ngAfterViewInit() {

    const currentDb = this.data.databases.find((db: any) => db.name === this.data.selectedDatabase);
    const table: any = currentDb.tables.find((table: any) => table.name === this.data.selectedTable.toString());
    this.data.currentForeignKey = table.foreign_keys.find((fk: any) => fk.column === this.data.columnName)

    currentDb.tables.map((item: any) => {
      if (item.name === this.data.currentForeignKey.foreign_table) {
        this.fkList = item.columns;
      }
    })

    if (this.fkList && this.fkList.length > 0) {
      this.foreignKey = [this.fkList.find((item: any) => this.data.currentForeignKey?.name?.indexOf(`${item.name}_fky`))?.name];
    }
  }

  public save() {

    const selectedForeignKey: FKModel = {
      foreign_table: this.data.currentForeignKey.foreign_table,
      foreign_name: this.foreignKey.toString() !== '' ? this.foreignKey.toString() : this.data.columnName,
      foreign_column: this.data.currentForeignKey.column,
      long_data: this.data.long_data
    };
    this.changeForeignKey.emit({ selectedForeignKey: selectedForeignKey, columnName: this.data.columnName });
  }
}
