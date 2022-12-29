
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component } from '@angular/core';

/**
 * Primary databases component allowing user to create a new database,
 * or connect to his existing database.
 */
@Component({
  selector: 'app-databases',
  templateUrl: './databases.component.html'
})
export class DatabasesComponent {

  databaseTypes: any;

  passDbTypesToParent(event: string[]) {
    this.databaseTypes = event;
  }
}
