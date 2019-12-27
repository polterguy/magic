
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { HttpService } from '../../http-service';

@Component({
  selector: 'app-[[filename]]',
  templateUrl: './[[filename]].component.html',
  styleUrls: ['./[[filename]].component.scss']
})
export class [[component-name]] implements OnInit {
  private data: any;
  private displayedColumns: string[] = [[[columns-list]]];
  private filter: any = {};
  private count: number = 1000;

  constructor(
    private httpService: HttpService,
    private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.filter.limit = 25;
    this.getData();
  }

  getData() {
    this.httpService.[[service-get-method]](this.filter).subscribe(res => {
      this.data = res;
    }, error => {
      this.error(error.error.message);
    });
  }

  paged(e: PageEvent) {
    this.filter.limit = e.pageSize;
    this.filter.offset = e.pageIndex * this.filter.limit;
    this.getData();
  }

  error(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
