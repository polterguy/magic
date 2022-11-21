/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

// Utility imports.
import { ThemeService } from 'src/app/services--/theme.service';
import { SystemReport } from 'src/app/models/dashboard.model';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit, OnDestroy, OnChanges {

  options: any;
  chartInstance: any;

  /**
   * The actual data received from the parent component, to be displayed on the chart.
   */
   @Input() data: SystemReport;

   /**
    * The main chart data.
    */
   public pieChartData: any = [];

  /**
   * Watches changes of the theme.
   */
  private subscribeThemeChange: Subscription;

  /**
   * Sets the current theme.
   */
  private theme: string = '';


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
      this.theme = val;
      this.getOptions();
    });


    this.waitForData();
  }

  ngOnChanges(changes: SimpleChanges): void {
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
        this.pieChartDataPrep();
        this.getOptions();
      }
    })();
  }

  /**
     * the preparation of the data for the pie chart
     */
   pieChartDataPrep(){
     this.pieChartData = [];
    let keys = Object.keys(this.data.modules);
    keys.forEach((key)  => {
      let locNumber = (this.data.modules[key].loc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      this.pieChartData.push({value: this.data.modules[key].files, name: key + ': ' + locNumber + ' lines of code'});
    })

  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
  }



  getOptions() {
    this.options = {
      tooltip: {
        trigger: 'item',
        appendToBody: true
      },
      legend: {
        orient: 'horizontal',
        left: 'top',
        top: 'bottom',
        type: 'scroll',
        padding: [15, 5, 0, 5],
        textStyle: {
          color: this.theme === 'light' ? 'black' : 'white'
        },
        pageIconColor: this.theme === 'light' ? 'black' : 'white',
        pageTextStyle: {
          color: this.theme === 'light' ? 'black' : 'white'
        }
      },
      series: [
        {
          // name: 'Access From',
          type: 'pie',
          // radius: '50%',
          radius: ['40%', '70%'],
          center: ['50%', '43%'],
          data: this.pieChartData,
          label: {
            color: this.theme === 'light' ? 'black' : 'white'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
  }
}
