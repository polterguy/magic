/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnInit } from '@angular/core';
import { SystemReport } from 'src/app/models/dashboard.model';
import { ThemeService } from 'src/app/_general/services/theme.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {

  // Available themes.
  themes: string[] = [
    'default',
    'neomorphism'
  ];

  // Selected theme.
  public selectedTheme: string = null;

  /**
   * Data coming from the parent component.
   */
  @Input() data: SystemReport;

  constructor(public themeService: ThemeService) { }
}
