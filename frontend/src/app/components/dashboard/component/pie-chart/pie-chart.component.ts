import { Component, Input, OnInit, ViewChild } from '@angular/core';

// Utility imports.
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective, Label, SingleDataSet } from 'ng2-charts';
// import { LogTypes } from '../../models/dashboard.model';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // chart options
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: false // changing it to true causes the pie chart to disappear!!
  };

  // @Input() data: LogTypes[];
  @Input() data: any;
  public pieChartLabels: Label[] = [];
  public pieChartData: SingleDataSet = [];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  
  constructor() { }

  ngOnInit(): void {

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
    let keys = Object.keys(this.data);
    let values = [];
    keys.forEach((key)  => {
      values.push(this.data[key]);
    })

    this.pieChartLabels = keys;
    this.pieChartData = values;
  }

}
