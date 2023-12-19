
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper component to display a single long entry and its details.
 */
@Component({
  selector: 'app-log-item-dialog',
  templateUrl: './log-item-dialog.component.html',
  styleUrls: ['./log-item-dialog.component.scss']
})
export class LogItemDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}
