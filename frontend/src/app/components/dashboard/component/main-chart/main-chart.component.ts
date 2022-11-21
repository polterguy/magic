import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/services--/theme.service';

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
   * Sets the current theme.
   */
  private theme: string = '';

  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {
    /**
     * Setting chart color based on the selected theme
     */
    this.subscribeThemeChange = this.themeService.themeChanged.subscribe((val: any) => {
      this.theme = val;
      this.prepareChart();
    });
    this.prepareChart();
  }

  prepareChart() {
    this.options = {
      tooltip: {
        trigger: 'axis',
        position: (pt) => {
          return [pt[0], '10%'];
        },
        appendToBody: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: this.data.value.label
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dotted',
            width: 1,
            color: this.theme === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'
          }
        }
      },
      series: [
        {
          name: this.data.value.name,
          data: this.data.value.data,
          type: this.chartType,
          smooth: true,
          symbol: 'none',
          areaStyle: {}
        }
      ]
    }
  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
  }
}
