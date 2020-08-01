
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SetupService } from 'src/app/services/setup-service';
import { TicketService } from 'src/app/services/ticket-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-evaluator',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  public config: any = null;
  public jwtSecret: string = null;
  public databaseType: string = null;
  public authenticationDatabase: string = 'magic_auth';
  public mssqlConnectionString: string = null;
  public mysqlConnectionString: string = null;
  public password: string = null;
  public repeatPassword: string = null;
  public hasShownSuccess = false;
  public isFetching = false;
  public taskScheduler = true;

  constructor(
    private setupService: SetupService,
    private ticketService: TicketService,
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
      this.password !== null &&
      this.connectionStringGood() &&
      this.password !== 'root') {
        if (!this.hasShownSuccess) {
          this.hasShownSuccess = true;
          this.showInfo('You can now save your configuration');
        }
        return true;
    }
    this.hasShownSuccess = false;
    return false;
  }

  connectionStringGood() {
    switch (this.databaseType) {
      case 'mssql':
        return this.mssqlConnectionString.indexOf('{database}') !== -1;
      case 'mysql':
        return this.mysqlConnectionString.indexOf('{database}') !== -1;
    }
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
    this.config.magic.databases.default = this.databaseType;
    this.config.magic.scheduler['auto-start'] = this.taskScheduler;
    this.isFetching = true;

    // Saving appsettings.json file on server.
    this.setupService.saveAppSettingsJson(this.config).subscribe(saveConfigResult => {

      if (saveConfigResult.result === 'success') {

        /*
         * To make sure server gets the required time to update our IConfiguration
         * object, we pause for 5 seconds here.
         */
        setTimeout(() => {

          /*
           * If settings are saved, our JWT token is no longer valid, since the JWT secret
           * has now been changed - Hence, logging in again.
           */
          this.ticketService.authenticate('root', 'root').subscribe(() => {

            // Setting up authentication system and database.
            this.setupService.setupAuthentication(
              this.databaseType,
              this.authenticationDatabase,
              'root',
              this.password,
              this.taskScheduler).subscribe(setupAuthResult => {

              if (setupAuthResult.result === 'success') {

                /*
                 * If it was a success setting up auth database and authenticaiton slot,
                 * our new password should now function - Hence, trying to login again,
                 * but this time with the new password.
                 */
                this.ticketService.authenticate('root', this.password).subscribe(() => {

                  // Success!
                  this.showInfo('You have successfully secured your system');

                  // Navigating to "Home" screen, and making sure we signal that setup is done.
                  this.router.navigate(['']);

                  // Hiding obscurer.
                  this.isFetching = false;

                }, error => {

                  // Couldn't authenticate with new password
                  this.showError(error.error.message);

                  // Hiding obscurer.
                  this.isFetching = false;
                });
              }
            }, error => {

              // Couldn't setup authentication.
              this.showError(error.error.message);

              // Hiding obscurer.
              this.isFetching = false;
            });
          }, error => {

            // Couldn't authenticate after saving config file.
            this.showError(error.error.message);

            // Hiding obscurer.
            this.isFetching = false;
          });
        }, 5000);
      }
    }, error => {

      // Couldn't save config file.
      this.showError(error.error.message);

      // Hiding obscurer.
      this.isFetching = false;
    });
  }

  /**
   * Shows an error
   * 
   * @param error Error, or string
   */
  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Shows generic information
   * 
   * @param info Information text to show
   */
  showInfo(info: string) {
    this.snackBar.open(info, 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar'],
    });
  }
}
