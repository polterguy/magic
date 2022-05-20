/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

// Utility imports.
import { ThemeService } from 'src/app/services/theme.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective, Label, SingleDataSet } from 'ng2-charts';
import { SystemReport } from 'src/app/models/dashboard.model';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

// Importing global chart colors.
import lightThemeColors from '../../_doughnut_chart_colors.json';
import darkThemeColors from '../../_doughnut_chart_colors.json';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.component.scss']
})
export class DoughnutChartComponent implements OnInit, OnDestroy {

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  /**
   * To specify colors dynamically from a json file and based on the selected theme.
   */
  public colors = [];

  /**
   * Watches changes of the theme.
   */
  private subscribeThemeChange: Subscription;

  /**
   * Sets the current theme.
   */
  private theme: string = '';

  // chart options
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 5 / 3.75,
    cutoutPercentage: 50,
    hover: { mode: null },
    legend: {
      display: true,
      labels: {
        fontColor: ''
      }
    },
    plugins: {
      datalabels: {
        align: 'center',

        padding: 0,
        offset: 0,
        color: (context) => {
          return (this.theme === 'light') ? 'black' : 'white'
        },
        font: (context) => {
          var w = context.chart.width;
          return {
            size: w < 512 ? 12 : 14,
            weight: 'bold'
          };
        },
        formatter: (value, context) => {
          return context.chart.data.labels[context.dataIndex] + ' \n' + (Number(context.chart.data.datasets[0].data[context.dataIndex]) * 100) / 10 + '%';
        }
      }
    },
    layout: {
      padding: 0
    },
    tooltips: {
      borderWidth: 1,
      caretPadding: 15,
      displayColors: false,
      callbacks: {
        label: (tooltipItem, data) => {
          const datasetLabel = this.doughnutChartLabels[tooltipItem.index] || '';
          return datasetLabel + ':';
        },
        footer: (tooltipItem, data) => {
          const datasetLabelLoc = this.doughnutChartData[tooltipItem[0].index] || '';
          return [datasetLabelLoc + ' requests'];
        }
      }
    }
  };

  /**
   * The actual data received from the parent component, to be displayed on the chart.
   */
  @Input() data: SystemReport;

  /**
   * An array containing the labels of the chart
   */
  public doughnutChartLabels: Label[] = [];

  /**
   * The main chart data.
   */
  public doughnutChartData: SingleDataSet = [];

  /**
   * Chart type.
   */
  public doughnutChartType: ChartType = 'doughnut';

  /**
   * Chart legend.
   */
  public doughnutChartLegend = true;

  /**
   * An external plugin, recommended by the Chart.js for managing labels.
   */
  public doughnutChartPlugins = [pluginDataLabels];

  /**
   * 
   * @param themeService For listening to the changes on the theme.
   */
  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {

    /**
     * Setting chart color based on the selected theme
     */
    this.subscribeThemeChange = this.themeService.themeChanged.subscribe((val: any) => {
      this.colors = (val === 'light') ? lightThemeColors : darkThemeColors;
      this.theme = val;

      if (this.chart !== undefined) {
        this.chart.options.legend.labels.fontColor = (val === 'light') ? 'black' : 'white';
        this.chart.chart = this.chart.getChartBuilder(this.chart.ctx);
      };
    });

    /**
     * waiting for the data to be ready
     * then call the preparation function
     */
    (async () => {
      while (!this.data)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.data) {
        this.doughnutChartDataPrep();
      }
    })();
  }

  /**
     * the preparation of the data for the doughnut chart
     */
  doughnutChartDataPrep() {
    let errorLog = this.data.last_log_items.filter(n => n.type === 'error' || n.type === 'fatal').length;
    let successLog = this.data.last_log_items.filter(n => n.type !== 'error' && n.type !== 'fatal').length;

    this.doughnutChartLabels = ['Failure', 'Success'];
    this.doughnutChartData = [errorLog, successLog];

    this.chart.options.legend.labels.fontColor = (this.theme === 'light' ? 'black' : 'white');
    this.chart.chart = this.chart.getChartBuilder(this.chart.ctx);
  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
  }

}
