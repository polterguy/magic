
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Status } from 'src/app/models/status.model';
import { ConfigService } from 'src/app/components/management/config/services/config.service';
import { FeedbackService } from '../../../services/feedback.service';

/**
 * Setup component allowing you to setup and modify your system's configuration.
 */
@Component({
  selector: 'app-config',
  templateUrl: './config.component.html'
})
export class ConfigComponent implements OnInit {

  /**
   * Status of setup process.
   */
  public status: Status = null;

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

    this.status = this.configService.setupStatus;
  }
}
