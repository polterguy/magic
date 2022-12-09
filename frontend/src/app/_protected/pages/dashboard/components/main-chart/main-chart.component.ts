
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/_general/services/general.service';
import { ThemeService } from 'src/app/_general/services/theme.service';

@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.scss']
})
export class MainChartComponent implements OnInit {
  /**
   * The actual data received from the parent component, to be displayed on the chart.
   */
  @Input() data: any = [];

  /**
  * Chart type.
  */
  chartType: string = 'line'

  options: any;

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

  constructor(
    private generalService: GeneralService,
    private themeService: ThemeService) { }

  ngOnInit(): void {
    /**
     * Setting chart color based on the selected theme
     */
    this.subscribeThemeChange = this.themeService.themeChanged.subscribe((val: any) => {
      this.theme = val;
      // this.prepareChart();
    });

    this.subscribeScreenSizeChange = this.generalService.getScreenSize().subscribe((isLarge: boolean) => {
      this.isLargeScreen = isLarge;
      if (this.data && Object.keys(this.data).length) {
        this.prepareChart();
      }
    })
    this.waitForData();

  }

  /**
   * waiting for the data to be ready
   * then call the preparation function
   */
  private waitForData() {
    (async () => {
      while (!this.data || !Object.keys(this.data).length)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.data) {

        this.prepareChart();
      }
    })();
  }

  prepareChart() {
    let xAxis: any = {};
    let series: any = {};

    const colors = ['rgba(91, 83, 247, 0.4)', 'rgba(68, 184, 198, 0.6)', 'rgba(91, 83, 247, 0.8)'];

    this.options = {
      color: colors,

      tooltip: {
        trigger: 'none',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        orient: this.isLargeScreen ? 'vertical' : 'horizontal',
        top: this.isLargeScreen ? 'middle' : '10',
        left: this.isLargeScreen ? '0' : 'center',
        backgroundColor: 'transparent',
        textStyle: {
          color: 'black',
          fontSize: 10
        },
      },
      grid: {
        top: 70,
        bottom: 20,
        right: 0,
        left: this.isLargeScreen ? '200' : '0',
        containLabel: true
      },
      xAxis: [],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: []
    };

    Object.keys(this.data).forEach((item: string, index: number) => {
      xAxis = {
        type: 'category',
        boundaryGap: false,
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          onZero: false,
          lineStyle: {
            color: colors[index]
          }
        },
        axisPointer: {
          label: {
            show: false,
          }
        },
        data: this.data[item].label
      };
      this.options.xAxis.push(xAxis);

      series = {
        name: this.data[item].name,
        type: 'line',
        xAxisIndex: index,
        smooth: false,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: colors[index]
        },
        emphasis: {
          focus: 'series'
        },
        data: this.data[item].data
      };
      this.options.series.push(series);
    })

  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
    this.subscribeScreenSizeChange.unsubscribe();
  }
}
