/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Inject, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigService } from 'src/app/services--/config.service';
import { FeedbackService } from 'src/app/services--/feedback.service';

@Component({
  selector: 'app-connection-string-dialog',
  templateUrl: './connection-string-dialog.component.html',
  styleUrls: ['./connection-string-dialog.component.scss'],
})
export class ConnectionStringDialogComponent implements OnInit {
  /**
   * List of available databases.
   */
  dbList: string[] = [];

  /**
   * Error to display if connection string is not good.
   */
  error = 'Connection string must contain {database} for your database';

  /**
   * Turns to true if the specified name for the new connection string already exists in that database.
   */
  nameExisting: boolean = false;

  /**
   * Form builder
   */
  connectionStringForm = this.formBuilder.group({
    connectionString: ['', [Validators.required]],
    selectedDb: ['', [Validators.required]],
    displayName: [
      '',
      [Validators.required, Validators.pattern(/^[a-z0-9]{2,20}$/)],
    ],
  });

  /**
   *
   * @param formBuilder Needed to create the form.
   * @param configService Needed to load databases and validate the connection string.
   * @param feedbackService Needed to show the feedback.
   * @param data Received databases details from the parent component.
   * @param dialogRef Accessing the current dialog component.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: { databases: any },
    private dialogRef: MatDialogRef<ConnectionStringDialogComponent>
  ) { }

  ngOnInit(): void {
    this.getDatabases();
  }

  /**
   * Retrieves the available databases.
   * Sets a default value for the database fields.
   * @callback fillPlaceholder By passing the database name
   */
  getDatabases() {
    this.configService.getDatabases().subscribe((res: any) => {
      this.dbList = res.options.filter((db: string) => { return db !== 'sqlite' });
      this.connectionStringForm.patchValue({
        selectedDb: res.default ? res.default : res.options[0],
      });
      this.fillPlaceholder(res.default ? res.default : res.options[0]);
    });
  }

  /**
   * Fills the placeholder of connection string field.
   * @param dbKey Database name.
   * @callback checkName If name was already given, then check the name against recently selected database.
   */
  fillPlaceholder(dbKey: string) {
    if (this.connectionStringForm.value.displayName !== '') {
      this.checkName();
    }
  }

  /**
   * Validates the provided connection string, to make sure it contains {database}.
   */
  validateConnectionString() {
    if (!this.connectionStringForm.value.connectionString.includes('{database}')) {
      this.connectionStringForm.controls.connectionString.setErrors({
        notValid: true
      });
    }
  }

  /**
   * Making sure the given name doesn't already exist in the selected database.
   */
  checkName() {
    let db: any = this.data.databases[this.connectionStringForm.controls.selectedDb.value];
    let givenName = this.connectionStringForm.value.displayName;
    for (const key in db) {
      if (key === givenName) {
        this.nameExisting = true;
        this.connectionStringForm.controls.displayName.setErrors({
          notValid: true,
        });
      } else {
        this.nameExisting = false;
        this.connectionStringForm.controls.displayName.setErrors({
          notValid: null,
        });
        this.connectionStringForm.controls.displayName.updateValueAndValidity();
      }
    }
  }

  /**
   * Invokes the endpoint to make sure the connection is valid
   * @param toTestBeforeSubmit Will be true if submit is requested and the connections string will be submitted only if the string is valid.
   */
  testConnectionString(toTestBeforeSubmit?: boolean) {
    const data = {
      databaseType: this.connectionStringForm.value.selectedDb,
      connectionString: this.connectionStringForm.value.connectionString,
    };
    this.configService.connectionStringValidity(data).subscribe({
      next: (res: any) => {
        if (res.result === 'success') {
          if (toTestBeforeSubmit !== true) {
            this.feedbackService.showInfo('Connection successful.');
          } else {
            this.submit();
          }
        } else if (res.result === 'failure') {
          this.feedbackService.showError(res.message);
        }
      },
      error: (error: any) => {
        this.feedbackService.showError(error);
      },
    });
  }

  /**
   * Closes the dialog for the data to be saved in the parent component.
   */
  submit() {
    const data = {
      connectionString: this.connectionStringForm.value.connectionString,
      selectedDb: this.connectionStringForm.value.selectedDb,
      name: this.connectionStringForm.value.displayName,
    };
    this.dialogRef.close(data);
  }
}
