
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Utility component imports.
import moment from 'moment';
import { ChartOptions } from 'chart.js';
import { Label, SingleDataSet } from 'ng2-charts';

// Application specific imports..
import { DiagnosticsService } from 'src/app/components/diagnostics/services/diagnostics.service';

// Importing global bar chart colors.
import barColors from '../bar_chart_colors.json';

/**
 * Component to show user when server has been restarted.
 */
@Component({
  selector: 'app-diagnostics-errors',
  templateUrl: './diagnostics-errors.component.html',
  styleUrls: ['./diagnostics-errors.component.scss']
})
export class DiagnosticsErrorsComponent implements OnInit {

  /**
   * Options for log items per day bar chart.
   */
  public pieOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    }
  };

  /**
   * Labels for log items per day bar chart.
   */
  public restartLabels: Label[] = [];

  /**
   * Dataset for log items per day bar chart.
   */
  public restartData: SingleDataSet = null;

  /**
   * Labels for log items per day bar chart.
   */
  public taskLabels: Label[] = [];

  /**
   * Dataset for log items per day bar chart.
   */
  public taskData: SingleDataSet = null;

  /**
   * Labels for log items per day bar chart.
   */
  public unhandledLabels: Label[] = [];

  /**
   * Dataset for log items per day bar chart.
   */
  public unhandledData: SingleDataSet = null;

  /**
   * Common bar chart colors.
   */
   public colors = barColors;

  /**
   * Creates an instance of your component.
   * 
   * @param diagnosticsService Needed to retrieve healt diagnostic data from backend
   */
  constructor(private diagnosticsService: DiagnosticsService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving restarts per day type of statistics.
    this.diagnosticsService.statisticsDays('Magic was successfully started').subscribe((res: any[]) => {
      this.restartData = res.map(x => x.count);
      this.restartLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });

    // Retrieving unhandled exceptions per day type of statistics.
    this.diagnosticsService.statisticsDays('Unhandled exception occurred \'').subscribe((res: any[]) => {
      this.unhandledData = res.map(x => x.count);
      this.unhandledLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });

    // Retrieving task executions per day type of statistics.
    this.diagnosticsService.statisticsDays('Unhandled exception while executing scheduled task with id of \'').subscribe((res: any[]) => {
      this.taskData = res.map(x => x.count);
      this.taskLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });
  }
}
