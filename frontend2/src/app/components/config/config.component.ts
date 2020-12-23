
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Injector, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../services/feedback.service';
import { Status } from 'src/app/models/status.model';
import { Response } from 'src/app/models/response.model';
import { ConfigService } from 'src/app/services/config.service';

// CodeMirror options.
import json from '../codemirror/options/json.json'

/**
 * Setup component allowing you to setup and modify your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  /**
   * Status of setup process.
   */
  public status: Status = null;

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * Raw configuration settings as returned from backend.
   */
  public config: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param setupService Setup HTTP service to use for retrieving and saving configuration settings for your backend
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService) {
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Checking status of backend.
    this.configService.status().subscribe((res: Status) => {
      this.status = res;
      if (res.magic_crudified && res.server_keypair && res.config_done) {

        // Fetching raw config from backend.
        this.configService.loadConfig().subscribe((res: any) => {
          this.config = JSON.stringify(res, null, 2);
        });
      }
    }, (error: any) => {
      this.feedbackService.showError(error);
    });
  }

  /**
   * Saves your configuration.
   */
  public save() {

    // Converting configuration to JSON.
    const config = JSON.parse(this.config);

    // Saving config by invoking backend.
    this.configService.saveConfig(config).subscribe((res: Response) => {

      // Sanity checking result of invocation.
      if (res.result === 'success') {
        this.feedbackService.showInfo('Configuration was successfully saved');
      } else {
        this.feedbackService.showError('Unspecified error when saving configuration');
      }
    }, (error: any) => this.feedbackService.showError(error));
  }
}
