
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Utility imports.
import moment from 'moment';
import { ChartOptions } from 'chart.js';
import { Label, SingleDataSet } from 'ng2-charts';

// Application specific imports.
import { DiagnosticsService } from 'src/app/services/diagnostics.service';

/**
 * Component that allows user to view health meta information about his installation specific
 * to log.
 */
@Component({
  selector: 'app-diagnostics-security',
  templateUrl: './diagnostics-security.component.html',
  styleUrls: ['./diagnostics-security.component.scss']
})
export class DiagnosticsSecurityComponent implements OnInit {

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
  public loginLabels: Label[] = [];

  /**
   * Dataset for log items per day bar chart.
   */
  public loginData: SingleDataSet = null;

  /**
   * Colors for log items per day bar chart.
   */
  public loginColors = [{
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
   * Labels for log items per day bar chart.
   */
  public failedLoginLabels: Label[] = [];

  /**
   * Dataset for log items per day bar chart.
   */
  public failedLoginData: SingleDataSet = null;

  /**
   * Colors for log items per day bar chart.
   */
  public failedLoginColors = [{
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
   * Labels for log items per day bar chart.
   */
  public accessDeniedLabels: Label[] = [];

  /**
   * Dataset for log items per day bar chart.
   */
  public accessDeniedData: SingleDataSet = null;

  /**
   * Colors for log items per day bar chart.
   */
  public accessDeniedColors = [{
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
   * @param diagnosticsService Needed to retrieve health data from backend
   */
  constructor(private diagnosticsService: DiagnosticsService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving logins per day type of statistics.
    this.diagnosticsService.statisticsDays('We successfully authenticated user \'').subscribe((res: any[]) => {
      this.loginData = res.map(x => x.count);
      this.loginLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });

    // Retrieving failed logins per day type of statistics.
    this.diagnosticsService.statisticsDays('Unhandled exception occurred \'Access denied\' at \'/magic/modules/system/auth/authenticate\'').subscribe((res: any[]) => {
      this.failedLoginData = res.map(x => x.count);
      this.failedLoginLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });

    // Retrieving access denied per day type of statistics.
    this.diagnosticsService.statisticsDays('Unhandled exception occurred \'Access denied\' at ').subscribe((res: any[]) => {
      this.accessDeniedData = res.map(x => x.count);
      this.accessDeniedLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });
  }
}
