
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { DefaultDatabaseType } from 'src/app/_general/models/default-database-type.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { SqlService } from 'src/app/_general/services/sql.service';

/**
 * Primary databases component allowing user to create a new database,
 * or connect to his existing database.
 */
@Component({
  selector: 'app-databases',
  templateUrl: './databases.component.html'
})
export class DatabasesComponent implements OnInit{

  databaseTypes: DefaultDatabaseType = null;

  constructor(
    private sqlService: SqlService,
    private generalService: GeneralService) { }

  ngOnInit() {
    this.getDefaultDbType();
  }

  private getDefaultDbType() {
    this.sqlService.defaultDatabaseType().subscribe({
      next: (result: DefaultDatabaseType) => {
        this.databaseTypes = result;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }
}
