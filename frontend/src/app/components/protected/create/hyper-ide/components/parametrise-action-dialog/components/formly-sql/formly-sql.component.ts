
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

// Application specific imports
import { SqlService } from 'src/app/services/sql.service';
import { Databases } from 'src/app/models/databases.model';
import { GeneralService } from 'src/app/services/general.service';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * Formly SQL extension field.
 */
@Component({
  selector: 'app-formly-sql',
  template: `
<div class="mb-4">
  <mat-icon
    [matTooltip]="connected ? 'You have a valid database connection' : 'You do not have a valid database connection'"
    [class]="connected ? 'connected' : 'disconnected'">
    {{connected ? 'check_circle' : 'report_problem'}}
  </mat-icon>
  <ngx-codemirror
    #editor
    class="sql-formly-editor"
    *ngIf="cmOptions"
    [options]="cmOptions"
    [(ngModel)]="model[field.key]">
  </ngx-codemirror>
</div>`,
  styleUrls: ['./formly-sql.scss']
})
export class FormlySqlComponent extends FieldType<FieldTypeConfig> implements OnInit {

  private databases: Databases = null;
  @ViewChild('editor') private editor: CodemirrorComponent;
  cmOptions: any = null;
  connected: boolean = false;

  constructor(
    private sqlService: SqlService,
    private cdr: ChangeDetectorRef,
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
      this.cdr.detectChanges();

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
          this.form.controls['connection-string'].valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            tap(() => {
                this.getDatabaseTables();
            })).subscribe();
          this.form.controls['database'].valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            tap(() => {
              if (!this.databases) {
                this.getDatabaseTables();
              } else {
                this.databaseChanged();
              }
            })).subscribe();
        }
      }, 1);
    }, 250);
  }

  /*
   * Private helpers.
   */

  private getDatabaseTables() {

    // Verifying we've got a "well known type" that allows us to retrieve database meta information.
    if (!this.model['database-type'] ||
        this.model['database-type'] === '' ||
        !this.model['connection-string'] ||
        this.model['connection-string'] === '' ||
        !this.model['database'] ||
        this.model['database'] === '') {

      // No valid database is selected.
      return;
    }

    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo(
      this.model['database-type'],
      this.model['connection-string']).subscribe({

      next: (result: Databases) => {

        this.generalService.hideLoading();
        this.databases = result;
        this.connected = true;
        this.formControl.setErrors(null);
        this.cdr.detectChanges();
        this.databaseChanged();
      },

      error: () => {

        this.generalService.hideLoading();
        this.connected = false;
        this.formControl.setErrors({connected: false});
        this.cmOptions.hintOptions = {
          tables: [],
        };
        this.cdr.detectChanges();
      }
    });
  }

  private databaseChanged() {

    let hintTables = (this.databases?.databases || [])
      .find((db: any) => db.name === this.model['database'])
      ?.tables || [];

    if (hintTables.length === 0) {

      this.connected = false;
      this.formControl.setErrors({connected: false});
      this.cmOptions.hintOptions = {
        tables: [],
      };
      this.cdr.detectChanges();

    } else {

      const hints = Object.fromEntries(hintTables.map((x: any) => [x.name, x.columns.map((y: any) => y.name)]));
      this.cmOptions.hintOptions = {
        tables: hints,
      };
      this.connected = true;
      this.formControl.setErrors(null);
      this.cdr.detectChanges();
    }
  }
}
