
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-log-item-details',
  templateUrl: './log-item-details.component.html',
  styleUrls: ['./log-item-details.component.scss']
})
export class LogItemDetailsComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}
