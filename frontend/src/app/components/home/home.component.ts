
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
  private error: string = null;

  constructor(private pingService: PingService) { }

  ngOnInit() {
    this.pingService.ping().subscribe(res => {
      this.version = res.version;
      if (res.warnings !== undefined) {
        for (let idx in res.warnings) {
          console.warn(res.warnings[idx]);
        }
      }
    });
  }
}
