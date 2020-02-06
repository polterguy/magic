import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

import { HttpService } from 'src/app/services/http-service';

/*
 * "Datagrid" component for displaying instance of [[component-header]]
 * entities from your HTTP REST backend.
 */
@Component({
  selector: '[[component-selector]]',
  templateUrl: './[[component-filename]].html',
  styleUrls: ['./[[component-filename]].scss']
})
export class [[component-name]] implements OnInit {

  private chartOptions: ChartOptions = {
    responsive: true,
    legend: {
      position: 'top',
    },
  };
  private chartLabels: Label[] = [];
  private chartData: number[] = [];
  private chartColors = [
    {
      backgroundColor: ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)'],
    },
  ];

  constructor(
    private httpService: HttpService,
    private jwtHelper: JwtHelperService,
    private snackBar: MatSnackBar) { }

  // OnInit implementation. Retrieves statistics from backend, and initialized data for our graph/chart.
  ngOnInit() {
    this.httpService.[[service-get-method]]({}).subscribe(res => {
      this.chartData = res.map(x => x.value);
      this.chartLabels = res.map(x => x.label);
    });
  }

  // Helper method to display an error to user in a friendly SnackBar type of widget.
  error(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
