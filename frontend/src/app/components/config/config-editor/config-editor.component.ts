
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../../services/feedback.service';
import { ConfigService } from 'src/app/components/config/services/config.service';

// CodeMirror options.
import json from '../../codemirror/options/json.json'
import { AuthService } from '../../auth/services/auth.service';

/**
 * Component that allows user to edit his configuration file as raw JSON.
 */
@Component({
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html'
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
   * @param feedbackService Needed to display feedback to user
   * @param configService Needed to load and save configuration file
   * @param authService Needed to verify user has access to components
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    public authService: AuthService) {
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Fetching config from backend.
    this.loadConfig();

    // Associating ALT+M with fullscreen toggling of the editor instance.
    this.cmOptions.json.extraKeys['Alt-M'] = (cm: any) => {
      cm.setOption('fullScreen', !cm.getOption('fullScreen'));
    };
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
