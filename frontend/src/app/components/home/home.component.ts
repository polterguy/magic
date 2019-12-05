
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { environment } from 'src/environments/environment';
import { PingService } from 'src/app/services/ping-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private version: string;
  private error: string = null;

  constructor(
    private pingService: PingService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.pingService.ping().subscribe(res => {
      this.version = res.version;
      if (res.warnings !== undefined) {
        for (const idx in res.warnings) {
          if (idx === 'defaultAuth') {
            // The default authentication slot has not been overridden.
            environment.defaultAuth = true;
          }
          console.warn(res.warnings[idx]);
        }
      }
      if (environment.defaultAuth) {
        this.showWarning('The default [magic.authenticate] slot has not been overridden,' +
          ' please secure your system by going through the "Setup" wizard.');
      }
    });
  }

  showWarning(warning: string) {
    this.snackBar.open(warning, 'Close', {
      duration: 10000,
      panelClass: ['warning-snackbar'],
    });
  }
}
