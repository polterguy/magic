import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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
      position: 'left',
    },
  };
  private chartLabels: Label[] = [];
  private chartData: number[] = [];
  private chartColors = [
    {
      backgroundColor: [
        'rgba(240,240,240,0.8)',
        'rgba(225,225,225,0.8)',
        'rgba(210,210,210,0.8)',
        'rgba(195,195,195,0.8)',
        'rgba(180,180,180,0.8)',
        'rgba(165,165,165,0.8)',
        'rgba(150,150,150,0.8)',
        'rgba(135,135,135,0.8)',
        'rgba(120,120,120,0.8)',
        'rgba(105,105,105,0.8)',
        'rgba(90,90,90,0.8)',
        'rgba(75,75,75,0.8)',
        'rgba(60,60,60,0.8)',
        'rgba(45,45,45,0.8)',
        'rgba(30,30,30,0.8)',
        'rgba(15,15,15,0.8)',
      ],
    },
  ];

  constructor(
    private httpService: HttpService,
    private snackBar: MatSnackBar) { }

  // OnInit implementation. Retrieves statistics from backend, and initialized data for our graph/chart.
  ngOnInit() {
    this.httpService.[[service-get-method]]({}).subscribe(res => {
      this.chartData = res.map(x => x.value);
      this.chartLabels = res.map(x => x.label);
    }, error => {
      this.error(error.error.message);
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
