
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { BackendService } from '../../../services/common/backend.service';
import { ConfigService } from '../../setting-security/configuration/_services/config.service';

import { SmtpDialogComponent } from '../../setting-security/configuration/components/smtp-dialog/smtp-dialog.component';
import { ConnectionStringDialogComponent } from '../connection-string-dialog/connection-string-dialog.component';

// CodeMirror options.
import json from '../../../../codemirror/options/json.json'
import { GeneralService } from 'src/app/_general/services/general.service';

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
   * By default Ctrl-Z removes all the text from the editor, if there is no more changed to undo,
   * which results in config variable to set to an empty string,
   * and therefore removing the editor.
   * To prevent that from happening, we set a new variable and change the condition to match this.
   * Will be true if loadConfig function has a value
   */
  public configExists: boolean = false;

  /**
   * Creates an instance of your component.
   *
   * @param feedbackService Needed to display feedback to user
   * @param configService Needed to load and save configuration file
   * @param backendService Needed to retrieve user's access rights from backend
   */
  constructor(
    private generalService: GeneralService,
    private configService: ConfigService,
    public backendService: BackendService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog) {
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
      next: (res: any) => {
        this.config = JSON.stringify(res, null, 2);
        if (res) {
          this.configExists = true;
          setTimeout(() => {
            var domNode = (<any>document.querySelector('.CodeMirror'));
            var editor = domNode.CodeMirror;
            editor.doc.markClean();
            editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
          }, 1);
          this.activatedRoute.queryParams.subscribe((params: any) => {
            const connect = params['connect'];
            if (connect) {
              this.addConnectionString()
            }
          });
        }
      },
      error: (error: any) => this.generalService.showFeedback(error)});
  }

  /**
   * Saves your configuration.
   */
  save() {
    try {
      const config = JSON.parse(this.config);
      this.configService.saveConfig(config).subscribe({
        next: () => {
          this.generalService.showFeedback('Configuration was successfully saved');
          setTimeout(() => {
            this.backendService.getRecaptchaKey();
          }, 1000);
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'ok', 4000)});
    }
    catch (error) {
      this.generalService.showFeedback(error, 'errorMessage', 'ok', 4000);
    }
  }

  addConnectionString() {
    this.dialog
      .open(ConnectionStringDialogComponent, {
        width: '650px',
        data: { databases: JSON.parse(this.config).magic.databases },
      })
      .afterClosed()
      .subscribe((result: any) => {
        if (result) {
          let selectedDb = JSON.parse(this.config);
          selectedDb.magic.databases[result.selectedDb][result.name] = result.connectionString;
          this.config = JSON.stringify(selectedDb, null, 2)
          this.save();
        }
      });
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
}
