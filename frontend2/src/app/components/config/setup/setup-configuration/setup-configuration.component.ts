
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { AuthService } from 'src/app/services/auth.service';
import { ConfigService } from 'src/app/services/config.service';
import { MessageService } from 'src/app/services/message.service';
import { BaseComponent } from 'src/app/components/base.component';
import { LoaderInterceptor } from 'src/app/services/interceptors/loader.interceptor';

/**
 * Setup configuration component for allowing user to configure his Magic
 * backend initially.
 */
@Component({
  selector: 'app-setup-configuration',
  templateUrl: './setup-configuration.component.html',
  styleUrls: ['./setup-configuration.component.scss']
})
export class SetupConfigurationComponent extends BaseComponent implements OnInit {

  // Configuration of Magic backend.
  private config: any = null;

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
   * Connection string to database.
   */
  public connectionString: string = null;

  /**
   * Root user's password.
   */
  public password: string = null;

  /**
   * Repeat value of root user's password.
   */
  public passwordRepeat: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param configService Configuration service used to read and save configuration settings
   * @param authService Used to authenticate user
   * @param loaderInterceptor Used to explicitly turn on spinner animation
   * @param messageService Used to publish event when status of setup process has changed
   */
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private loaderInterceptor: LoaderInterceptor,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.configService.loadConfig().subscribe(res => {
      this.config = res;
      this.configService.getGibberish(50, 100).subscribe((res: Response) => {
        this.config.magic.auth.secret = res.result;
      });
    }, (error: any) => this.showError(error));
  }

  /**
   * Invoked when selected database type is changed by user.
   */
  public databaseTypeChanged() {
    this.connectionString = this.config.magic.databases[this.selectedDatabaseType].generic;
  }

  /**
   * Saves configuration, default database type, and root password.
   */
  public save() {

    // Invoking backend to save configuration as specified by user.
    this.loaderInterceptor.increment();
    this.configService.setup(
      this.selectedDatabaseType,
      this.password,
      this.config).subscribe(res => {

      // Verifying we were successful.
      if (res.result === 'success') {

        /*
         * Success!
         * Notice, to give backend some time to change the configuration
         * object for its thread pool threads, we'll need to wait a bit
         * before we re-fetch the status object - Hence, we therefor wait
         * for 500 milliseconds before we login again, using the user's
         * new root password, before we publish our status changed event.
         */
        setTimeout(() => {
          this.authService.login(
            'root',
            this.password,
            false).subscribe(() => {
            this.messageService.sendMessage({
              name: Messages.SETUP_STATE_CHANGED,
              content: 'config'
            });
          });
        }, 1500);
      } else {

        // Error of some undefined sort!
        this.loaderInterceptor.decrement();
        this.showError('Something went wrong when trying to invoke your backend');
      }
    }, (error: any) => {
      this.showError(error);
      this.loaderInterceptor.decrement();
    });
  }
}
