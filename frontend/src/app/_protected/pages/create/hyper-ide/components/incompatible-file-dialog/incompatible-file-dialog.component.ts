
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Modal dialog asking user what he or she wants to do with an incompatible file, that
 * Hyper IDE does not have a registered editor for.
 */
@Component({
  selector: 'app-incompatible-file-dialog',
  templateUrl: './incompatible-file-dialog.component.html'
})
export class IncompatibleFileDialogComponent {

  /**
  * Creates an instance of your component.
  * 
  * @param data File object type and name
  */
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}
