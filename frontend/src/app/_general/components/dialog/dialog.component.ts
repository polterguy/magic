
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Common dialog allowing for dynamically injecting another component.
 */
@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html'
})
export class DialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    component?: any,
    title?: string
  }) { }
}
