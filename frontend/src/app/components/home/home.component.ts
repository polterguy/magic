
import { Component, OnInit } from '@angular/core';
import { PingService } from 'src/app/services/ping-service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private version: string;

  constructor(
    private pingService: PingService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.pingService.version().subscribe(res => {
      this.version = res.version;
    }, error => {
      this.snackBar.open(error.error.message || 'Something went wrong when trying to ping backend', 'Close');
    });
  }

  getVersion() {
    return this.version;
  }
}
