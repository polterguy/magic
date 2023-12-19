
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/components/protected/common/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/services/general.service';
import { FileService } from 'src/app/services/file.service';
import { SqlService } from 'src/app/services/sql.service';
import { Databases } from 'src/app/models/databases.model';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';

/**
 * Helper component allowing you to manage your existing locally installed
 * SQLite databases.
 */
@Component({
  selector: 'app-manage-databases',
  templateUrl: './manage-databases.component.html',
  styleUrls: ['./manage-databases.component.scss']
})
export class ManageDatabasesComponent implements OnInit {

  displayedColumns: string[] = ['name', 'tables', 'actions'];
  databases: any = [];
  existingDatabases: any = [];
  isLoadingDbs: boolean = true;
  zipFileInput: any;
  databaseName: string = '';

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private dialog: MatDialog,
    private sqlService: SqlService,
    private fileService: FileService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.getDatabases();
  }

  createNewDatabase() {

    if (this.databaseName === '') {

      this.generalService.showFeedback('Please provide a name', 'errorMessage');
      return;
    }

    if (!this.CommonRegEx.appNameWithUppercaseHyphen.test(this.databaseName)) {

      this.generalService.showFeedback(this.CommonErrorMessages.appNameWithUppercaseHyphen, 'errorMessage');
      return;
    }

    this.generalService.showLoading();
    this.sqlService.createDatabase(
      'sqlite',
      'generic',
      this.databaseName).subscribe({
        next: () => {

          this.generalService.showFeedback('Database successfully created', 'successMessage');
          this.getDatabases();
        },
        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', -1)
        }
      });
  }

  downloadDatabaseBackup(database: any) {

    this.fileService.downloadFile('/data/' + database.name + '.db');
  }

  uploadDatabaseBackup(file: any) {

    this.fileService.uploadDatabaseBackup(file.item(0)).subscribe({

      next: () => {
        this.generalService.showFeedback('Backup was successfully uploaded', 'successMessage');
        this.zipFileInput = null;
        this.getDatabases();
      },

      error: (error: any) => {

        this.zipFileInput = null;
        this.generalService.showFeedback(error);
      }
    });
  }

  deleteDatabase(item: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete database`,
        description_extra: `You are deleting the following database: <br/> <span class="fw-bold">${item.name}</span> <br/><br/>This action is permanent. Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: item,
          action: 'confirmInput',
          fieldToBeTypedTitle: `database name`,
          fieldToBeTypedValue: item.name,
          icon: 'database',
        }
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.sqlService.dropDatabase(
          'sqlite',
          'generic',
          item.name).subscribe({
            next: () => {
              this.generalService.showFeedback('Database successfully deleted', 'successMessage');
              this.getDatabases();
            },
            error: (error: any) => {
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            }});
      }
    });
  }

  /*
   * Private helper methods
   */
  private getDatabases() {

    this.existingDatabases = [];
    this.isLoadingDbs = true;
    this.generalService.showLoading();
    this.sqlService.getDatabaseMetaInfo('sqlite', 'generic').subscribe({

        next: (res: Databases) => {

          res.databases.map((item: any) => {
            item.type = 'sqlite';
            item.connectionString = 'generic';
          });
          this.existingDatabases = [...this.existingDatabases, ...res.databases];
          this.isLoadingDbs = false;
          this.generalService.hideLoading();
        },

        error: (error: any) => {

          this.generalService.hideLoading();
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
  }
}
