
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface FKData {
  database: any,
  foreign_keys: any,
  currentForeignKey: any
}

export interface FKModel {
  foreign_table: string,
  foreign_column: string,
  foreign_name: string,
  long_data: boolean
}

@Component({
  selector: 'app-foreign-key-dialog',
  templateUrl: './foreign-key-dialog.component.html',
  styleUrls: ['./foreign-key-dialog.component.scss']
})
export class ForeignKeyDialogComponent implements OnInit {

  public fkList: any = [];

  public foreignKey: string[] = [];
  public selectedForeignKey: FKModel;

  public long: boolean = true;

  constructor(
    private dialogRef: MatDialogRef<ForeignKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FKData) { }

  ngOnInit(): void {
    this.data.database.tables.map((item: any) => {
      if (item.name === this.data.foreign_keys.foreign_table) {
        this.fkList = item.columns;
      }
    })
    if (this.fkList && this.fkList.length > 0) {
      this.foreignKey = [this.fkList.find((item: any) => this.data.currentForeignKey.name.indexOf(`${item.name}_fky`)).name];
    }
    this.fkList.map((el: any) => console.log(typeof el.name))
  }

  public save() {
    this.selectedForeignKey = {
      foreign_table: this.data.foreign_keys.foreign_table,
      foreign_name: this.foreignKey.toString(),
      foreign_column: this.data.foreign_keys.column,
      long_data: this.long
    };
    this.dialogRef.close({ selectedForeignKey: this.selectedForeignKey });
  }
}
