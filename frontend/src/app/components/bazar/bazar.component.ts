
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { FileService } from '../files/services/file.service';
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

  // Modules already installed.
  private folders: string[] = [];

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
    private fileService: FileService,
    private configService: ConfigService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving already installed modules.
    this.fileService.listFolders('/modules/').subscribe((folders: string[]) => {

      // Assigning model.
      this.folders = folders.map(x => {
        const res = x.substr(9);
        return res.substr(0, res.length - 1);
      });
    });

    // Retrieving Bazar modules from backend.
    this.configService.getBazarManifest().subscribe((result: AppManifest[]) => {

      // Assigning result to model.
      this.apps = result;
    });
  }

  /**
   * Returns true if module is already installed.
   * 
   * @param module Module to check
   */
  public isInstalled(module: AppManifest) {
    return this.folders.indexOf(module.module_name) !== -1;
  }

  /**
   * Installs the specified module into your modules folder.
   * 
   * @param module Module to install
   */
  public install(module: AppManifest) {

    // Invoking backend to install module.
    this.configService.installBazarModule(module).subscribe(() => {
      
      // Providing feedback to user.
      this.feedbackService.showInfoShort('Module was successfully installed');

      // Removing module from list of modules.
      this.folders.push(module.module_name);

    }, (error: any) => this.feedbackService.showError(error));
  }
}
