
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { ConfigService } from 'src/app/components/config/services/config.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Component that allows user to see and edit his license information.
 */
@Component({
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss']
})
export class LicenseComponent implements OnInit {

  /**
   * Contains license information.
   */
  public licenseInfo: any = null;

  /**
   * License info applied by user.
   */
  public license: any = '';

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to retrieve license information from backend
   */
  constructor(
    private configService: ConfigService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving license information from backend.
    this.getLicense();
  }

  /**
   * Invoked when user wants to apply license to backend.
   */
  public applyLicense() {

    // Saves license by invoking backend.
    this.configService.saveLicense(this.license).subscribe(() => {

      // Showing user some feedback that operation was successful.
      this.feedbackService.showInfo('License applied to backend');

      // Retrieving license information.
      this.getLicense();
    });
  }

  /**
   * Invoked when the license information needs to be retrieved from the backend.
   */
  public getLicense() {

    // Invoking backend to retrieve license information, if existing.
    this.configService.license().subscribe((licenseInfo: any) => {
      this.licenseInfo = licenseInfo;
    }, (error: any) => this.feedbackService.showError(error));
  }
}
