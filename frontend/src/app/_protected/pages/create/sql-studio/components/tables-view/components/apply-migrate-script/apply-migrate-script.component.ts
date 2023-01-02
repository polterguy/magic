
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface Sql {
  sql: string,
}

/**
 * Helper component to allow user to apply migration scripts as he or she is editing
 * the database DDL.
 */
@Component({
  selector: 'app-apply-migrate-script',
  templateUrl: './apply-migrate-script.component.html'
})
export class AddMigrateScriptComponent {

  public codemirrorReady: boolean = false;

  public options: any = null;

  constructor(
    private dialogRef: MatDialogRef<AddMigrateScriptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Sql) { }

  /*
   * Invoked if user wants to apply current SQL as a migration script.
   */
  create() {
    this.dialogRef.close({
      apply: true,
    });
  }
}
