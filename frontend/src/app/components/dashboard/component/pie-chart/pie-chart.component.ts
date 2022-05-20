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
import lightThemeColors from '../../_pie_chart_colors.json';
import darkThemeColors from '../../_bar_chart_colors.json';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit, OnDestroy {

  @ViewChild(BaseChartDirective) chartPie: BaseChartDirective | undefined;

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
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true, 
    maintainAspectRatio: true,
    aspectRatio: 5 / 3.75,
    legend: {
      display: true,
      labels: {
        fontColor: ''
      }
    },
    plugins: {
      datalabels: {
        align: 'end',
        clamp: true,
        padding: 0,
        offset: 0,
        display: 'auto',
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
          return context.chart.data.labels[context.dataIndex] + ' \n' + context.chart.data.datasets[0].data[context.dataIndex] + ' files';
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
          const datasetLabel = this.pieChartLabels[tooltipItem.index] || '';
          return  datasetLabel + ':';
        },
        footer: (tooltipItem, data) => {
          const datasetLabelLoc = this.pieChartLocLabel[tooltipItem[0].index] || '';
          const filesCount = this.pieChartData[tooltipItem[0].index]
          return [datasetLabelLoc + ' lines of code in ' + filesCount + ' files'];
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
  public pieChartLabels: Label[] = [];
  
  /**
   * Containing "loc" labels -> lines of code.
   */
  public pieChartLocLabel: string[] = [];
  
  /**
   * The main chart data.
   */
  public pieChartData: SingleDataSet = [];
  
  /**
   * Chart type.
   */
  public pieChartType: ChartType = 'pie';
  
  /**
   * Chart legend.
   */
  public pieChartLegend = true;
  
  /**
   * An external plugin, recommended by the Chart.js for managing labels.
   */
  public pieChartPlugins = [pluginDataLabels];
  
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

      
      if (this.chartPie !== undefined) {
        this.chartPie.options.legend.labels.fontColor = (val === 'light' ? 'black' : 'white');
        this.chartPie.chart = this.chartPie.getChartBuilder(this.chartPie.ctx);
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
        this.pieChartDataPrep();
      }
    })();
  }

  /**
     * the preparation of the data for the pie chart
     */
  pieChartDataPrep(){
    let keys = Object.keys(this.data.modules);
    let valuesFiles = [];
    let valuesLoc = [];
    keys.forEach((key)  => {
      valuesFiles.push(this.data.modules[key].files);
      valuesLoc.push(this.data.modules[key].loc);
    })

    this.pieChartLabels = keys;
    this.pieChartData = valuesFiles;
    this.pieChartLocLabel = valuesLoc;

    this.chartPie.options.legend.labels.fontColor = (this.theme === 'light' ? 'black' : 'white');
    this.chartPie.chart = this.chartPie.getChartBuilder(this.chartPie.ctx);
  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
  }

}
