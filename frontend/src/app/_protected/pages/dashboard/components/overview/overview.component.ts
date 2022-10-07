/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnInit } from '@angular/core';
import { SystemReport } from 'src/app/models/dashboard.model';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  /**
   * Data coming from the parent component.
   */
  @Input() data: SystemReport;

  constructor() { }

  ngOnInit(): void {
  }
}
