
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { AppManifest } from '../config/models/app-manifest.model';
import { ConfigService } from '../config/services/config.service';
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Bazar component allowing you to obtain additional Micro Service backend
 * modules for your Magic installation.
 */
@Component({
  selector: 'app-bazar',
  templateUrl: './bazar.component.html',
  styleUrls: ['./bazar.component.scss']
})
export class BazarComponent implements OnInit {

  /**
   * Apps as returned from backend.
   */
  public apps: AppManifest[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to retrieve Bazar manifests
   */
  constructor(
    private configService: ConfigService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving Bazar modules from backend.
    this.configService.getBazarManifest().subscribe((result: AppManifest[]) => {

      // Assigning result to model.
      this.apps = result;
    });
  }

  /**
   * Installs the specified module into your modules folder.
   * 
   * @param module Module to install
   */
  public install(module: AppManifest) {

    // Invoking backend to install module.
    this.configService.installBazarModule(module).subscribe((result: Response) => {
      
      // Providing feedback to user.
      this.feedbackService.showInfoShort('Module was successfully installed');
    });
  }
}
