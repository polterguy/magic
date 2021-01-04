
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Utility component imports.
import moment from 'moment';
import { ChartOptions } from 'chart.js';
import { Label, SingleDataSet } from 'ng2-charts';

// Application specific imports..
import { HealthService } from 'src/app/services/health.service';

/**
 * Component to show user when server has been restarted.
 */
@Component({
  selector: 'app-health-restarts',
  templateUrl: './health-restarts.component.html',
  styleUrls: ['./health-restarts.component.scss']
})
export class HealthRestartsComponent implements OnInit {

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
   * Colors for log items per day bar chart.
   */
  public restartColors = [{
    backgroundColor: [
      'rgba(200,200,200,0.6)',
      'rgba(190,190,190,0.6)',
      'rgba(180,180,180,0.6)',
      'rgba(170,170,170,0.6)',
      'rgba(160,160,160,0.6)',
      'rgba(150,150,150,0.6)',
      'rgba(140,140,140,0.6)',
      'rgba(130,130,130,0.6)',
      'rgba(120,120,120,0.6)',
      'rgba(110,110,110,0.6)',
      'rgba(100,100,100,0.6)',
      'rgba(90,90,90,0.6)',
      'rgba(80,80,80,0.6)',
      'rgba(70,70,70,0.6)',
    ]}];

  /**
   * Creates an instance of your component.
   * 
   * @param healthService Needed to retrieve healt diagnostic data from backend
   */
  constructor(private healthService: HealthService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving logins per day type of statistics.
    this.healthService.statisticsDays('Magic was successfully started').subscribe((res: any[]) => {
      this.restartData = res.map(x => x.count);
      this.restartLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });
  }
}
