
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../../../services/feedback.service';
import { ConfigService } from 'src/app/services/management/config.service';

// CodeMirror options.
import json from '../../../codemirror/options/json.json'
import { AuthService } from '../../../../services/auth.service';
import { BackendService } from 'src/app/services/backend.service';

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
   * @param backendService Needed to retrieve user's access rights from backend
   * @param authService Needed to verify user has access to components
   */
  constructor(
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    public backendService: BackendService,
    public authService: AuthService) {
  }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.loadConfig();
    this.cmOptions.json.extraKeys['Alt-M'] = (cm: any) => {
      cm.setOption('fullScreen', !cm.getOption('fullScreen'));
      let sidenav = document.querySelector('.mat-sidenav');
      sidenav.classList.contains('d-none') ? sidenav.classList.remove('d-none') :
      sidenav.classList.add('d-none');
    };
  }

  /**
   * Loads configuration from backend.
   */
  loadConfig() {
    this.configService.loadConfig().subscribe({
      next: (res: any) => this.config = JSON.stringify(res, null, 2),
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Saves your configuration.
   */
  save() {
    try {
      const config = JSON.parse(this.config);
      this.configService.saveConfig(config).subscribe({
        next: () => this.feedbackService.showInfo('Configuration was successfully saved'),
        error: (error: any) => this.feedbackService.showError(error)});
    }
    catch (error) {
      this.feedbackService.showError(error);
    }
  }
}
