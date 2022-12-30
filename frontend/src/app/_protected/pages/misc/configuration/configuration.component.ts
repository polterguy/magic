
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { ConfigService } from '../../../../_general/services/config.service';

import json from '../../../../codemirror/options/json.json'
import { CodemirrorActionsService } from '../../create/hyper-ide/services/codemirror-actions.service';
import { Subscription } from 'rxjs';
import { SmtpDialogComponent } from './components/smtp-dialog/smtp-dialog.component';

/**
 * Helper component allowing user to edit his configuration settings.
 */
@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit, OnDestroy {

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * Raw configuration settings as returned from backend.
   */
  public config: string = '';
  public originalConfig: string = '';

  /**
   * By default Ctrl-Z removes all the text from the editor, if there is no more changed to undo,
   * which results in config variable to set to an empty string,
   * and therefore removing the editor.
   * To prevent that from happening, we set a new variable and change the condition to match this.
   * Will be true if loadConfig function has a value
   */
  public configExists: boolean = false;

  private codemirrorActionSubscription!: Subscription;

  /**
   * Creates an instance of your component.
   *
   * @param feedbackService Needed to display feedback to user
   * @param configService Needed to load and save configuration file
   * @param backendService Needed to retrieve user's access rights from backend
   */
  constructor(
    private dialog: MatDialog,
    private configService: ConfigService,
    public backendService: BackendService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) {
  }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.loadConfig();
    this.getCodeMirrorOptions();
    this.watchForActions();
  }

  /**
   * Loads configuration from backend.
   */
  loadConfig() {
    this.configService.loadConfig().subscribe({
      next: (res: any) => {
        this.config = JSON.stringify(res, null, 2);
        this.originalConfig = JSON.stringify(res, null, 2);
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  public reset() {
    this.config = this.originalConfig;
  }

  /**
   * Saves your configuration.
   */
  save() {
    try {
      const config = JSON.parse(this.config);
      this.configService.saveConfig(config).subscribe({
        next: () => {
          this.generalService.showFeedback('Configuration was successfully saved', 'successMessage');
          setTimeout(() => {
            this.backendService.getRecaptchaKey();
          }, 1000);
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'ok', 4000)
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
    })
  }

  ngOnDestroy() {
    this.codemirrorActionSubscription?.unsubscribe();
  }
}
