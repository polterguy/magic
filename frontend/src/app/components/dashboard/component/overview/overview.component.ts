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

  @Input() data: SystemReport;

  public segmentOptions: string[] = [];

  public extraSegment: any = null;

  constructor() { }

  ngOnInit(): void {
    localStorage.getItem('extra_segment') ? this.extraSegment = JSON.parse(localStorage.getItem('extra_segment')!) : '';
  }

  getSegmentOptions() {
    this.segmentOptions = [];
    for (const key in this.data) {
      if ((typeof this.data[key]) !== 'object' && key !== 'default_db' && key !== 'default_timezone' && key !== 'version' && key !== 'endpoints') {
        this.segmentOptions.push(key);
      }
    };
  }

  setExtraSegment(segment: string) {
    this.extraSegment = {title: segment.split('_').join(' '), value: this.data[segment]};
    localStorage.setItem('extra_segment', JSON.stringify(this.extraSegment));
  }
}
