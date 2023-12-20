
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Databases } from 'src/app/models/databases.model';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';
import { GeneralService } from 'src/app/services/general.service';
import { SqlService } from 'src/app/services/sql.service';

/**
 * CodeMirror Formly extension field.
 */
@Component({
  selector: 'app-codemirror-formly',
  template: `<ngx-codemirror #editor *ngIf="cmOptions" [options]="cmOptions" [(ngModel)]="model[field.key]"></ngx-codemirror>`,
})
export class CodemirrorSqlFormlyComponent extends FieldType<FieldTypeConfig> implements OnInit {

  private databases: Databases = null;
  @ViewChild('editor') private editor: CodemirrorComponent;
  cmOptions: any = null;
  ready: boolean = false;

  constructor(
    private sqlService: SqlService,
    private cdn: ChangeDetectorRef,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService) {

    super();
  }

  ngOnInit() {

    /*
     * CodeMirror doesn't support being initialised as component is not displayed,
     * and Angular applies animations to fade in using opacity ... :/
     * 
     * Hence the timeout hack here ...
     */
    setTimeout(() => {

      // This will display CodeMirror due to its *ngIf part.
      this.cmOptions = this.codemirrorActionsService.getActions(null, 'sql');
      this.cmOptions.autofocus = false;
      this.cdn.detectChanges();

      // Waiting until CodeMirror is displayed, and cleaning history.
      setTimeout(() => {

        // Cleaning out history and marking editor as clean.
        this.editor.codeMirror.getDoc().markClean();
        this.editor.codeMirror.getDoc().clearHistory();

        // Verifying we've got database type, connection string, and database values.
        if (this.form.controls['database-type'] &&
          this.form.controls['connection-string'] &&
          this.form.controls['database']) {

          // Retrieving tables for autocomplete.
          this.getDatabaseTables();

          // Making sure we listen to changes in model.
          this.form.controls['database-type'].valueChanges.subscribe({
            next : () => {
              this.getDatabaseTables();
            }
          });
          this.form.controls['connection-string'].valueChanges.subscribe({
            next : () => {
              this.getDatabaseTables();
            }
          });
          this.form.controls['database'].valueChanges.subscribe({
            next : () => {
              this.databaseChanged();
            }
          });
        }
      }, 1);
    }, 250);
  }

  /*
   * Private helpers.
   */

  private getDatabaseTables() {

    // Verifying we've got a "well known type" that allows us to retrieve database meta information.
    if (this.model['database-type'] === '' ||
        this.model['connection-string'] === '' ||
        this.model['database'] === '') {

      // No valid database is selected.
      return;
    }

    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo(this.model['database-type'], this.model['connection-string']).subscribe({

      next: (result: Databases) => {

        this.databases = result;
        this.generalService.hideLoading();
        this.databaseChanged();
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Not a valid database-type/connection-string combination', 'errorMessage');
      }
    });
  }

  private databaseChanged() {

    let hintTables = (this.databases.databases || []).find((db: any) => db.name === this.model['database'])?.tables || [];
    const hints = Object.fromEntries(hintTables.map((x: any) => [x.name, x.columns.map((y: any) => y.name)]));
    this.cmOptions.hintOptions = {
      tables: hints,
    };
}
}
