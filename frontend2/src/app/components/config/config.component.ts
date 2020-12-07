
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Status } from 'src/app/models/status.model';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from 'src/app/models/response.model';
import { ConfigService } from 'src/app/services/config.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Setup component allowing you to setup and modify your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent extends BaseComponent implements OnInit {

  /**
   * Status of setup process.
   */
  public status: Status = null;

  /**
   * Raw configuration settings as returned from backend.
   */
  public config: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param setupService Setup HTTP service to use for retrieving and saving configuration settings for your backend
   * @param messageService Message service used to publish messages to other components in the system
   */
  constructor(
    private configService: ConfigService,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Checking status of backend.
    this.configService.status().subscribe((res: Status) => {
      this.status = res;
      if (res.magic_crudified && res.server_keypair && res.setup_done) {

        // Fetching raw config from backend.
        this.configService.loadConfig().subscribe((res: any) => {
          this.config = JSON.stringify(res, null, 2);
        });
      }
    }, (error: any) => {
      this.showError(error);
    });
  }

  /**
   * Saves your configuration.
   */
  public save() {

    // Converting configuration to JSON and invoking backend.
    const config = JSON.parse(this.config);
    this.configService.saveConfig(config).subscribe((res: Response) => {
      this.showInfo('Configuration was successfully saved');
    });
  }
}
