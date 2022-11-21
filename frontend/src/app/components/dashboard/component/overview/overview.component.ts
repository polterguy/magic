/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnInit } from '@angular/core';
import { SystemReport } from 'src/app/models/dashboard.model';
import { BackendService } from 'src/app/services--/backend.service--';
import { Clipboard } from '@angular/cdk/clipboard';

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

  /**
   * Specifies the status of the copy function.
   */
  public notClicked: boolean = true;

  constructor(
    private clipboard: Clipboard,
    private backendService: BackendService) { }

  ngOnInit(): void {
    localStorage.getItem('extra_segment') ? this.extraSegment = JSON.parse(localStorage.getItem('extra_segment')!) : '';
  }

  /**
   * Preparing the extra segments array to be displayed in the view.
   */
  getSegmentOptions() {
    this.segmentOptions = {};
    for (const key in this.data) {
      if ((typeof this.data[key]) !== 'object' && key !== 'default_db' && key !== 'default_timezone' && key !== 'version' && key !== 'endpoints' && key !== 'server_ip') {
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

  /**
   * Returns the user's status to caller.
   */
   getActiveBackendUrl() {
    let url = this.backendService.active.url.replace('http://', '').replace('https://', '');
    return url;
  }

  public copy(value: string) {
    this.clipboard.copy(value);
    this.notClicked = false;
    setTimeout(() => {
      this.notClicked = true;
    }, 800);
  }
}
