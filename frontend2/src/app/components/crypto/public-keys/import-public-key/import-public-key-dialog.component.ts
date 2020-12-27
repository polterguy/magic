
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Modal dialog component for importing a public key.
 */
@Component({
  selector: 'app-import-public-key-dialog',
  templateUrl: './import-public-key-dialog.component.html',
  styleUrls: ['./import-public-key-dialog.component.scss']
})
export class ImportPublicKeyComponent implements OnInit {

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog
   * @param feedbackService Needed to be able to display information to user
   */
  constructor(
    private dialogRef: MatDialogRef<ImportPublicKeyComponent>,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {
  }

  /**
   * Invoked when user clicks the import button to actually import the public key.
   */
  public import() {
    this.dialogRef.close({});
    console.log('foo');
  }
}
