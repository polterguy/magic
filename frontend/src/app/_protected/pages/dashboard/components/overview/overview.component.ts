/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SystemReport } from 'src/app/models/dashboard.model';
import { OverviewDialogComponent } from './components/overview-dialog/overview-dialog.component';

/**
 * General information component, showing user key information about his system,
 * such as backend version, IP address of cloudlet, etc.
 */
@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {

  /**
   * Data coming from the parent component.
   */
  @Input() data: SystemReport;

  public displayableList: any = [];
  private fullList: any = titles;
  private titles: string[] = [];

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    const storedSelections: string = localStorage.getItem('overviewItems') || '';
    if (storedSelections && storedSelections !== '') {
      this.titles = JSON.parse(storedSelections);
      this.displayableList = this.fullList.filter((item: any) => this.titles.find((el: any) => { return el === item.name }));
    } else {
      this.displayableList = this.fullList.filter((el: any) => { return el.isDefault === true });
      this.fullList.map((el: any) => {
        if (el.isDefault === true) {
          this.titles.push(el.name)
        }
      });
    }
  }

  public more() {
    this.dialog.open(OverviewDialogComponent, {
      width: '500px',
      autoFocus: false,
      data: {
        currentList: this.displayableList,
        fullList: this.fullList,
        titles: this.titles
      }
    }).afterClosed().subscribe((newTitles: any) => {
      if (newTitles) {
        this.titles = newTitles;
        this.displayableList = this.fullList.filter((item: any) => this.titles.find((el: any) => { return el === item.name }));
      }
    })
  }
}

const titles: any = [
  {
    name: 'Database type',
    key: 'default_db',
    isDefault: true
  },
  {
    name: 'Timezone',
    key: 'default_timezone',
    isDefault: true
  },
  {
    name: 'Version',
    key: 'version',
    isDefault: true
  },
  {
    name: 'Endpoints',
    key: 'endpoints',
    isDefault: true
  },
  {
    name: 'Server IP',
    key: 'server_ip',
    isDefault: true
  },
  {
    name: 'Cached items',
    key: 'cache_items',

  },
  {
    name: 'Dynamic slots',
    key: 'dynamic_slots',

  },
  {
    name: 'Active schedule',
    key: 'has_scheduler'
  },
  {
    name: 'Active socket',
    key: 'has_sockets'
  },
  {
    name: 'Active terminal',
    key: 'has_terminal'
  },
  {
    name: 'Logged items',
    key: 'log_items'
  },
  {
    name: 'Persisted tasks',
    key: 'persisted_tasks'
  },
  {
    name: 'Slots',
    key: 'slots'
  }
]
