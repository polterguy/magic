
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { ConfigService } from 'src/app/services/config.service';
import { FeedbackService } from '../../../services/feedback.service';

// CodeMirror options.
import json from '../../codemirror/options/json.json'

/**
 * Component that allows user to edit his configuration file as raw JSON.
 */
@Component({
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.scss']
})
export class ConfigEditorComponent implements OnInit {

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

    // Fetching config from backend.
    this.loadConfig();
  }

  /**
   * Loads configuration from backend.
   */
  public loadConfig() {

    // Fetching raw config from backend.
    this.configService.loadConfig().subscribe((res: any) => {

      // Creating a JSON object out of result, that will be displayed in CodeMirror instance.
      this.config = JSON.stringify(res, null, 2);

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Saves your configuration.
   */
  public save() {

    // In case conversion to JSON fails.
    try {

      // Converting configuration to JSON.
      const config = JSON.parse(this.config);

      // Saving config by invoking backend.
      this.configService.saveConfig(config).subscribe(() => {

        // Giving user feedback about operation.
        this.feedbackService.showInfo('Configuration was successfully saved');

    }, (error: any) => this.feedbackService.showError(error));
    }
    catch (error) {
      this.feedbackService.showError(error);
    }
  }
}
