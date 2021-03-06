
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Injector, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from 'src/app/components/config/services/config.service';

/**
 * Setup configuration component for allowing user to configure his Magic
 * backend initially.
 */
@Component({
  selector: 'app-setup-auth',
  templateUrl: './setup-auth.component.html',
  styleUrls: ['./setup-auth.component.scss']
})
export class SetupAuthComponent implements OnInit {

  /**
   * Configuration as returned from backend.
   */
  public config: any = null;

  /**
   * Database types the user can select during configuration of system.
   */
  public databaseTypes: string[] = [
    'mysql',
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
    protected messageService: MessageService) {
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving backend's configuration.
    this.configService.loadConfig().subscribe(res => {

      // Assigning config field to result of invocation.
      this.config = res;

      // Creating some random gibberish to use as default JWT secret.
      this.configService.getGibberish(50, 100).subscribe((res: Response) => {

        // Applying gibberish to relevant configuration section.
        this.config.magic.auth.secret = res.result;
      });
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the next button.
   */
  public next() {

    // Sanity checking connection string.
    if (this.config.magic.databases[this.selectedDatabaseType].generic.indexOf('{database}') === -1) {

      // Not good!
      this.feedbackService.showError('Connection string is not valid, it needs the {database} section');
      return;
    }

    // Invoking backend to save configuration as specified by user.
    this.configService.setup(
      this.selectedDatabaseType,
      this.password,
      this.config).subscribe(() => {

      // Signaling to other components we've updated setup state.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED
      });

    }, (error: any) => this.feedbackService.showError(error));
  }
}
