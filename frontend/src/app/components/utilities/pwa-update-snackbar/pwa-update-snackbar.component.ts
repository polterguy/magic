import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-pwa-update-snackbar',
  templateUrl: './pwa-update-snackbar.component.html',
  styleUrls: ['./pwa-update-snackbar.component.scss']
})
export class PwaUpdateSnackbarComponent implements OnInit {

  constructor(public snackbar: MatSnackBar, private swUpdate: SwUpdate) { }

  ngOnInit(): void {
  }

  dismiss(){
    this.snackbar.dismiss()
  }

  reloadPage(): void {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
