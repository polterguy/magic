
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';

/**
 * Main wire frame application component.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  sidenavOpened = false;

  constructor(
    private dialog: MatDialog,
    public authService: AuthService) { }

  ngOnInit() {
    this.authService.getEndpoints().subscribe(res => {
      console.log(res);
    });
  }

  /**
   * Closes navbar.
   */
  closeNavbar() {
    this.sidenavOpened = false;
  }

  /**
   * Opens navbar.
   */
  openNavbar() {
    this.sidenavOpened = true;
  }

  /**
   * Allows user to login by showing a modal dialog.
   */
  login() {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '350px',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  /**
   * Logs the user out from his current backend.
   */
  logout() {
    this.authService.logout();
  }
}
