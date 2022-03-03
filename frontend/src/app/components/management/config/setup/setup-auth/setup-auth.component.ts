
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/management/config.service';

/**
 * Setup configuration component for allowing user to configure his Magic
 * backend initially.
 */
@Component({
  selector: 'app-setup-auth',
  templateUrl: './setup-auth.component.html'
})
export class SetupAuthComponent implements OnInit {

  /**
   * If true, allows user to paste in an existing appSettings.json file
   * into a textarea editor.
   */
  public showAdvanced: boolean = false;

  /**
   * Contains config file in its entirety.
   */
  public json: string = '';

  /**
   * Configuration as returned from backend.
   */
  public config: any = null;

  /**
   * Database types the user can select during configuration of system.
   */
  public databaseTypes: string[] = [
    'mysql',
    'pgsql',
    'mssql',
  ];

  /**
   * Currently selected database type.
   */
  public selectedDatabaseType: string = null;

  /**
   * Root user's password.
   */
  public password = '';

  /**
   * Repeat value of root user's password.
   */
  public passwordRepeat = '';

  /**
   * Creates an instance of your component.
   * 
   * @param configService Configuration service used to read and save configuration settings
   * @param messageService Used to publish event when status of setup process has changed
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private authService: AuthService,
    protected messageService: MessageService) {
  }
  
  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving backend's configuration.
    this.configService.loadConfig().subscribe(config => {

      // Assigning config field to result of invocation.
      this.config = config;

      // Creating some random gibberish to use as default JWT secret.
      this.configService.getGibberish(50, 100).subscribe((gibberish: Response) => {

        // Applying gibberish to relevant configuration section.
        this.config.magic.auth.secret = gibberish.result;

        // Making sure we create JSON string value for advanced configuration.
        this.json = JSON.stringify(this.config, null, 2);
      });
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the next button.
   */
  public next() {

    // Sanity checking auth secret.
    if (this.config.magic.auth.secret.length < 50 || this.config.magic.auth.secret.length > 100) {

      // No good AUTH secret.
      this.feedbackService.showError('Auth secret must be between 50 and 100 charaters in length');
      return;
    }

    // Sanity checking connection string.
    if (this.config.magic.databases[this.selectedDatabaseType].generic.indexOf('{database}') === -1) {

      // Not good!
      this.feedbackService.showError('Connection string is not valid, it needs the {database} section');
      return;
    }

    // Invoking backend to save configuration as specified by user.
    this.config.magic.databases.default = this.selectedDatabaseType;
    this.configService.setupSystem(
      this.password,
      this.config).subscribe(() => {

      // Signaling to other components we've updated setup state.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED
      });

      this.configService.changeStatus(true);

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when appSettings.json file should be saved directly.
   */
  public saveAdvanced() {

    // Saving raw appSettings.json file by invoking backend.
    this.configService.saveConfig(JSON.parse(this.json)).subscribe((result: Response) => {

      // Success!
      this.authService.logout(true, false);
      this.feedbackService.showInfo('You will need to login again');
    });
  }
}
