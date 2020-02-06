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

  /*
   * This is needed to figure out whether or not user has access to
   * delete, create and update methods.
   */
  private roles: string [] = [];

  private chartOptions: ChartOptions = {
    responsive: true,
    legend: {
      position: 'left',
    },
  };
  private chartLabels: Label[] = [];
  private chartData: number[] = [];
  private chartColors = [
    {
      backgroundColor: ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)'],
    },
  ];

  // Constructor taking a bunch of services/helpers through dependency injection.
  constructor(
    private httpService: HttpService,
    private jwtHelper: JwtHelperService,
    private snackBar: MatSnackBar) {

    // Checking if user is logged in, at which point we initialize the roles property.
    const token = localStorage.getItem('jwt_token');
    if (token !== null && token !== undefined) {

      // Yup! User is logged in!
      this.roles = this.jwtHelper.decodeToken(token).role.split(',');
    }
  }

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
