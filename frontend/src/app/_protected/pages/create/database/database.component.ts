
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html'
})
export class DatabaseComponent {

  public databaseTypes: any;

  public passDbTypesToParent(event: string[]) {
    this.databaseTypes = event;
  }
}
