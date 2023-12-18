
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/services/general.service';
import { ThemeService } from 'src/app/services/theme.service';

/**
 * Primary chart component for dashboard, showing a line chart with statistics as returned
 * from the backend.
 */
@Component({
  selector: 'app-main-chart',
  templateUrl: './main-chart.component.html',
  styleUrls: ['./main-chart.component.scss']
})
export class MainChartComponent implements OnInit {

  private subscribeScreenSizeChange: Subscription;
  private isLargeScreen: boolean = undefined;

  @Input() data: any = [];

  chartType: string = 'line'
  options: any;

  constructor(
    private generalService: GeneralService,
    private themeService: ThemeService) { }

  ngOnInit() {

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

    this.options = {
      color: this.themeService.theme_options.charts.category.colors,

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
            color: this.themeService.theme_options.charts.category.colors[index]
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
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: this.themeService.theme_options.charts.category.colors[index]
        },
        emphasis: {
          focus: 'series'
        },
        data: this.data[item].data
      };
      this.options.series.push(series);
    })

  }

  ngOnDestroy() {

    this.subscribeScreenSizeChange.unsubscribe();
  }
}
