
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export class CodeModel {
  code: string;
}

/**
 * Code dialog, showing user some code snippet.
 */
@Component({
  selector: 'app-code-dialog',
  templateUrl: './code-dialog.component.html',
  styleUrls: ['./code-dialog.component.scss']
})
export class CodeDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: CodeModel) { }
}
