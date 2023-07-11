
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { ConfigService } from '../../../../_general/services/config.service';

import { CodemirrorActionsService } from '../../../../_general/services/codemirror-actions.service';
import { Subscription } from 'rxjs';
import { SmtpDialogComponent } from './components/smtp-dialog/smtp-dialog.component';
import json from '../../../../codemirror/options/json.json'
import { OpenAIConfigurationDialogComponent } from 'src/app/_general/components/openai/openai-configuration-dialog/openai-configuration-dialog.component';
import { RecaptchaDialogComponent } from './components/recaptcha-dialog/recaptcha-dialog.component';
import { FileService } from 'src/app/_general/services/file.service';

/**
 * Helper component allowing user to edit his configuration settings.
 */
@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit, OnDestroy {

  private codemirrorActionSubscription!: Subscription;

  config: string = '';
  configExists: boolean = false;
  jsonFileInput: any;
  cmOptions = {
    json: json,
  };

  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    private configService: ConfigService,
    public backendService: BackendService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    this.loadConfig();
    this.getCodeMirrorOptions();
    this.watchForActions();
  }

  loadConfig() {

    this.generalService.showLoading();
    this.configService.loadConfig().subscribe({
      next: (res: any) => {

        this.config = JSON.stringify(res, null, 2);
        this.generalService.hideLoading();
      },
      error: (error: any) => {
        
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  downloadBackup() {

    this.fileService.downloadFile('/config/appsettings.json');
  }

  uploadBackup(file: any) {

    if (file.length === 0 || file.item(0).name !== 'appsettings.json') {

      this.generalService.showFeedback('You have to choose an appsettings.json file', 'errorMessage', 'Ok', 5000);
      return;
    }

    this.generalService.showLoading();
    this.fileService.uploadFile('/config/', file[0]).subscribe({

      next: () => {

        this.jsonFileInput = null;
        this.generalService.showFeedback('Backup of configuration file successfully uploaded', 'successMessage');
        this.loadConfig();
      },

      error: (error: any) => {
 
        this.jsonFileInput = null;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000);
        this.generalService.hideLoading();
      }
    });
  }

  save() {

    try {
      const config = JSON.parse(this.config);
      this.generalService.showLoading();
      this.configService.saveConfig(config).subscribe({
        next: () => {

          this.generalService.showFeedback('Configuration was successfully saved', 'successMessage');
          this.generalService.hideLoading();
          setTimeout(() => {
            this.backendService.getRecaptchaKey();
          }, 1000);
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000);
        }
      });
    }
    catch (error) {

      this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000);
    }
  }

  manageSMTP() {

    this.dialog
      .open(SmtpDialogComponent, {
        width: '650px',
        data: JSON.parse(this.config).magic.smtp,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {
          let config = JSON.parse(this.config);
          config.magic.smtp = result;
          this.config = JSON.stringify(config, null, 2)
          this.save();
        }
      });
  }

  manageOpenAI() {

    this.dialog
      .open(OpenAIConfigurationDialogComponent, {
        width: '80vw',
        maxWidth: '550px',
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {
          this.loadConfig();
        }
      });
  }

  manageCAPTCHA() {

    this.dialog
      .open(RecaptchaDialogComponent, {
        width: '80vw',
        maxWidth: '550px',
        data: JSON.parse(this.config).magic.auth.recaptcha,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {
          let config = JSON.parse(this.config);
          config.magic.auth.recaptcha = result;
          this.config = JSON.stringify(config, null, 2)
          this.save();
        }
      });
  }

  ngOnDestroy() {

    this.codemirrorActionSubscription?.unsubscribe();
  }

  /*
   * Private helper methods.
   */

  private getCodeMirrorOptions() {

    const options = this.codemirrorActionsService.getActions(null, 'json');
    this.cmOptions.json = options;
  }

  private watchForActions() {

    this.codemirrorActionSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {
      switch (action) {

        case 'save':
          this.save();
          break;
      }
    });
  }
}
