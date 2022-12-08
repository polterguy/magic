
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { ThemeService } from 'src/app/_general/services/theme.service';
import { SystemReport } from '../../_models/dashboard.model';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, OnDestroy {

  /**
   * The actual data received from the parent component, to be displayed on the chart.
   */
  @Input() data: SystemReport;
  @Input() log: boolean = false;
  @Input() complexity: boolean = false;

  public options: any;

  /**
  * The main chart data.
  */
  public logData: any = [];
  public complexityData: any = [];

  /**
   * Watches changes of the theme.
   */
  private subscribeThemeChange: Subscription;

  /**
   * Watches changes of the theme.
   */
  private subscribeScreenSizeChange: Subscription;

  private isLargeScreen: boolean = undefined;

  /**
   * Sets the current theme.
   */
  private theme: string = '';

  /**
   *
   * @param themeService For listening to the changes on the theme.
   */
  constructor(
    private cdr: ChangeDetectorRef,
    private generalService: GeneralService,
    private themeService: ThemeService) { }

  ngOnInit(): void {

    /**
     * Setting chart color based on the selected theme
     */
    this.subscribeThemeChange = this.themeService.themeChanged.subscribe((val: any) => {
      this.theme = val;
      // this.getOptions();
    });

    this.subscribeScreenSizeChange = this.generalService.getScreenSize().subscribe((isLarge: boolean) => {
      this.isLargeScreen = isLarge;
      this.getOptions();
    })
    this.waitForData();
  }

  /**
     * waiting for the data to be ready
     * then call the preparation function
     */
  private waitForData() {
    (async () => {
      while (!this.data)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.data) {
        this.logDataPrep().then((result: string) => {
          this.complexityDataPrep().then((res: string) => {
            if (res === 'done') {
              this.getOptions();
            }
          });
        })
      }
    })();
  }

  /**
     * the preparation of the data for the pie chart
     */
  logDataPrep() {
    return new Promise(resolve => {
      this.logData = [];
      let errorLog = this.data.last_log_items.filter(n => n.type === 'error' || n.type === 'fatal').length;
      let successLog = this.data.last_log_items.filter(n => n.type !== 'error' && n.type !== 'fatal').length;
      this.logData = [
        { value: errorLog, name: 'Failure' },
        { value: successLog, name: 'Success' }
      ];
      resolve('done')
    })
    // this.getOptions();
  }

  private complexityDataPrep() {
    return new Promise(resolve => {
      this.complexityData = [];
      let keys = Object.keys(this.data.modules);
      keys.forEach((key) => {
        let locNumber = (this.data.modules[key].loc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        this.complexityData.push({ value: this.data.modules[key].files, name: key + ': ' + locNumber + ' lines of code' });
      })
      resolve('done')
    })
  }

  getOptions() {
    this.options = {
      tooltip: {
        trigger: 'item',
        appendToBody: true
      },
      legend: {
        orient: this.isLargeScreen ? 'vertical' : 'horizontal',
        left: '0',
        top: this.isLargeScreen ? 'middle' : '0',
        type: 'scroll',
        padding: [0, 5],
        textStyle: {
          color: 'black',
          fontSize: 10
        },
        pageIconColor: 'black',
        pageTextStyle: {
          color: 'black'
        }
      },
      series: [
        {
          type: 'pie',
          radius: ['64%', '70%'],
          right: this.isLargeScreen ? '-40%' : '',
          data: this.log === true ? this.logData : this.complexityData,
          color: ['#FF3B2F', '#2FFF37', '#0080FF'],
          label: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: false
          },
        }
      ]
    }

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
    this.subscribeScreenSizeChange.unsubscribe();
  }
}
