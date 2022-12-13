
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-log-exception',
  templateUrl: './log-exception.component.html',
  styleUrls: ['./log-exception.component.scss']
})
export class LogExceptionComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) { }
}
