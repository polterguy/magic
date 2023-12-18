
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { MagicResponse } from '../../../../../../models/magic-response.model';
import { BazarService } from 'src/app/services/bazar.service';

/**
 * View details modal dialog for showing user general information about some specific plugin.
 */
@Component({
  selector: 'app-view-plugin',
  templateUrl: './view-plugin.component.html',
  styleUrls: ['./view-plugin.component.scss']
})
export class ViewPluginComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}
