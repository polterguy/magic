
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
  cmOptions = {
    json: json,
  };

  constructor(
    private dialog: MatDialog,
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
