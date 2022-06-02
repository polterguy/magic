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

  /**
   * New segment to be chosen by the user.
   */
  public segmentOptions: any = {};

  /**
   * To carry the selected value and set into localStorage
   */
  public extraSegment: any = {};

  constructor() { }

  ngOnInit(): void {
    localStorage.getItem('extra_segment') ? this.extraSegment = JSON.parse(localStorage.getItem('extra_segment')!) : '';
  }

  /**
   * Preparing the extra segments array to be displayed in the view.
   */
  getSegmentOptions() {
    this.segmentOptions = {};
    for (const key in this.data) {
      if ((typeof this.data[key]) !== 'object' && key !== 'default_db' && key !== 'default_timezone' && key !== 'version' && key !== 'endpoints') {
        this.segmentOptions[key.split('_').join(' ')] = this.data[key];
      }
    };
  }

  /**
   *
   * @param segment The selected segment from the list.
   * will be stored in the localStorage
   */
  setExtraSegment(segment: any) {
    this.extraSegment['title'] = segment.key;
    this.extraSegment['value'] = segment.value;

    localStorage.setItem('extra_segment', JSON.stringify(this.extraSegment));
  }
}
