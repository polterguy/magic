
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { ConfigService } from '../../../../../services/config.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';

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
  showAdvanced: boolean = false;

  /**
   * Contains config file in its entirety.
   */
  json: string = '';

  /**
   * Configuration as returned from backend.
   */
  config: any = null;

  /**
   * Database types the user can select during configuration of system.
   */
  databaseTypes: string[] = [
    'mysql',
    'pgsql',
    'mssql',
    'sqlite',
  ];

  /**
   * Currently selected database type.
   */
  selectedDatabaseType: string = null;

  /**
   * Timezone information for system, can either be 'none', 'utc', or 'local'.
   */
  defaultTimeZone: string = 'none';

  /**
   * Root user's password.
   */
  password = '';

  /**
   * Repeat value of root user's password.
   */
  passwordRepeat = '';

  /**
   * Creates an instance of your component.
   * 
   * @param feedbackService Needed to display feedback to user
   * @param configService Configuration service used to read and save configuration settings
   * @param messageService Used to publish event when status of setup process has changed
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private backendService: BackendService,
    protected messageService: MessageService) { }
  
  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.configService.loadConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.configService.getGibberish(80, 150).subscribe({
          next: (gibberish: Response) => {
            this.config.magic.auth.secret = gibberish.result;
            this.config.magic.auth.recaptcha ? '' : this.config.magic.auth.recaptcha = {};
            this.json = JSON.stringify(this.config, null, 2);
          },
          error: (error: any) => this.feedbackService.showError(error)});
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns the full name of the specified database type.
   * 
   * @param type Type of database
   * @returns Name of database type according to type specified
   */
  getDatabaseName(type: string) {
    switch (type) {

      case 'mysql':
        return 'MySQL';

      case 'mssql':
        return 'SQL Server';

      case 'pgsql':
        return 'PostgreSQL';

      case 'sqlite':
        return 'SQLite';
    }
  }

  /**
   * Invoked when user clicks the next button.
   */
  next() {
    if (this.config.magic.auth.secret.length < 50 || this.config.magic.auth.secret.length > 200) {
      this.feedbackService.showError('Auth secret must be between 50 and 200 charaters in length');
      return;
    }
    if (this.config.magic.databases[this.selectedDatabaseType].generic.indexOf('{database}') === -1) {
      this.feedbackService.showError('Connection string is not valid, it needs the {database} section');
      return;
    }
    this.config.magic.databases.default = this.selectedDatabaseType;
    this.config.magic.culture.defaultTimeZone = this.defaultTimeZone;
    this.configService.setupSystem(
      this.password,
      this.config).subscribe({
        next: () => {
          this.feedbackService.showInfoShort('Database successfully configured');
          this.backendService.active.status.config_done = true;
          this.backendService.getRecaptchaKey();
          this.configService.installModules().subscribe({
            next: () => console.log('All modules were successfully installed'),
            error: (error: any) => this.feedbackService.showError(error)
          });
        },
        error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when appSettings.json file should be saved directly.
   */
  saveAdvanced() {
    this.configService.saveConfig(JSON.parse(this.json)).subscribe({
      next: () => {
        this.backendService.logout(true);
        this.feedbackService.showInfo('You will need to login again');
      },
      error: (error: any) =>this.feedbackService.showError(error)});
  }

  validateConnectionString() {
    return (this.config.magic.databases[this.selectedDatabaseType].generic).includes('{database}');
  }
}
