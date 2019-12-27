
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpService } from '../http-service';

@Component({
  selector: 'app-[[filename]]',
  templateUrl: './[[filename]].component.html',
  styleUrls: ['./[[filename]].component.scss']
})
export class [[component-name]] implements OnInit {
  private data: any;
  private displayedColumns: string[] = [[[columns-list]]];

  constructor(
    private httpService: HttpService,
    private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.httpService.[[service-get-method]]({}).subscribe(res => {
      this.data = res;
    }, error => {
      this.error(error.error.message);
    });
  }

  error(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }
}
