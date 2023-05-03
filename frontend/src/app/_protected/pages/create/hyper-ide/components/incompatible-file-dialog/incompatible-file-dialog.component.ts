
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
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

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}
