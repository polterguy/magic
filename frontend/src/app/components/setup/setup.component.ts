
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';
import { AuthenticateService } from 'src/app/services/authenticate-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-evaluator',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  config: any = null;
  jwtSecret: string = null;
  databaseType: string = null;
  mssqlConnectionString: string = null;
  mysqlConnectionString: string = null;
  password: string = null;
  repeatPassword: string = null;
  hasShownSucces = false;

  constructor(
    private setupService: SetupService,
    private authService: AuthenticateService,
    private snackBar: MatSnackBar,
    private router: Router) { }

  ngOnInit() {
    this.setupService.getAppSettingsJson().subscribe(res => {
      this.config = res;
      this.jwtSecret = this.config.magic.auth.secret;
      this.mssqlConnectionString = this.config.magic.databases.mssql.generic;
      this.mysqlConnectionString = this.config.magic.databases.mysql.generic;
    }, error => {
      this.showError(error.error.message);
    });
  }

  checkConfig() {
    if (this.jwtSecret !== null &&
      this.jwtSecret.length >= 50 &&
      this.databaseType !== null &&
      this.password === this.repeatPassword &&
      this.password !== null) {
        if (!this.hasShownSucces) {
          this.hasShownSucces = true;
          this.showInfo('You can now save your configuration');
        }
        return true;
    }
    this.hasShownSucces = false;
    return false;
  }

  // Saves settings as supplied by user.
  save() {

    /*
     * Applying input from user into config object, before transmitting it to
     * the server to save appsettings.json file.
     */
    this.config.magic.auth.secret = this.jwtSecret;
    this.config.magic.databases.mssql.generic = this.mssqlConnectionString;
    this.config.magic.databases.mysql.generic = this.mysqlConnectionString;

    // Saving appsettings.json file on server.
    this.setupService.saveAppSettingsJson(this.config).subscribe(res => {

      if (res.result === 'success') {

        /*
         * To make sure server gets the required time to pudate our IConfiguration
         * object, we pause for a second here.
         */
        setTimeout(() => {

          /*
           * If settings are saved, our JWT token is no longer valid, since the JWT secret
           * has now been changed - Hence, logging in again.
           */
          this.authService.authenticate('root', 'root').subscribe(res2 => {

            // Changing our JWT token.
            localStorage.setItem('access_token', res2.ticket);

            // Setting up authentication system and database.
            this.setupService.setupAuthentication(this.databaseType, 'root', this.password).subscribe(res3 => {

              if (res3.result === 'success') {

                /*
                 * If it was a success setting up auth database and authenticaiton slot,
                 * our new password should now function - Hence, trying to login again,
                 * but this time with the new password.
                 */
                this.authService.authenticate('root', this.password).subscribe(res4 => {

                  // Changing our JWT token.
                  localStorage.setItem('access_token', res4.ticket);

                  // Success!
                  this.showInfo('You have successfully secured your system');

                  // Navigating to "Home" screen.
                  this.router.navigate(['']);

                }, error => {

                  // Couldn't authenticate with new password
                  this.showError(error.error.message);
                });
              }
            }, error => {

              // Couldn't setup authentication.
              this.showError(error.error.message);
            });
          }, error => {

            // Couldn't authenticate after saving config file.
            this.showError(error.error.message);
          });
        }, 1000);
      }
    }, error => {

      // couldn't save config file.
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showInfo(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar'],
    });
  }
}
