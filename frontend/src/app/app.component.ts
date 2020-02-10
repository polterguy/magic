
import { Component, OnInit } from '@angular/core';
import { TicketService } from './services/ticket-service';
import { MatSnackBar } from '@angular/material';
import { interval } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PingService } from './services/ping-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private username = '';
  private password = '';
  private backendUrl = environment.apiURL;
  private connectedToBackend = false;

  constructor(
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private pingService: PingService,
    private router: Router) { }

  ngOnInit() {
    this.periodicallyValidateJwtToken();
    this.ping();
    if (!this.isLoggedIn() && this.router.url !== '') {
      this.router.navigate(['']);
    }
  }

  backendUrlChanged() {

    // Need to verify the new URL is a valid magic.backend.
    environment.apiURL = this.backendUrl;
    this.ping();
  }

  // Verifies that the user is connected to a magic backend.
  ping() {
    this.pingService.ping().subscribe(res => {
      if (res.result === 'success') {
        this.connectedToBackend = true;
      } else {
        this.connectedToBackend = false;
      }
    }, err => {
      this.connectedToBackend = false;
      this.showError('Not connected to backend. Make sure you start your Magic backend, ' +
        'or change the backend URL to an actual Magic installation');
    });
  }

  // Returns true if client is authenticated.
  isLoggedIn() {
    return this.ticketService.hasTicket();
  }

  // Logs out the user.
  logout() {
    this.ticketService.logout();
    this.router.navigate(['']);
  }

  // Logs in user with username/password combination from HTML page.
  login() {
    environment.apiURL = this.backendUrl;
    this.ticketService.authenticate(this.username, this.password).subscribe(res => {
      this.username = '';
      this.password = '';
      if (this.hasDefaultPassword()) {
        this.router.navigate(['/setup']);
      }
    }, (error) => {
      this.showError(error.error.message);
    });
  }

  hasDefaultPassword() {
    return this.ticketService.hasDefaultPassword();
  }

  /*
   * Creates a timeout that executes every 10 seconds, that simply ensure the JWT token
   * is valid - And if not, removes it from local storage, and logs out the user.
   */
  public periodicallyValidateJwtToken() {

    // Makes sure we check token every 10 seconds.
    interval(10000).subscribe(x => {

      // Checking if token exists or is expired, and if so, logs out user.
      if (!this.ticketService.hasTicket()) {
        this.logout();
        return;
      }

      /*
       * Checking if we should refresh JWT token.
       */
      const expirationSeconds = this.ticketService.getExpirationSeconds();
      if (expirationSeconds < 120) {
        this.ticketService.refreshTicket();
      }
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  showWarning(warning: string) {
    this.snackBar.open(warning, 'Close', {
      duration: 10000,
      panelClass: ['warning-system-snackbar'],
    });
  }
}
