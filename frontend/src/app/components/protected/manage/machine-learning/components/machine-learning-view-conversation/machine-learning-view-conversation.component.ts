
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * Helper component to view an entire conversation.
 */
@Component({
  selector: 'app-machine-learning-view-conversation',
  templateUrl: './machine-learning-view-conversation.component.html',
  styleUrls: ['./machine-learning-view-conversation.component.scss']
})
export class MachineLearningViewConversationComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<MachineLearningViewConversationComponent>) { }

  close() {

    this.dialogRef.close();
  }
}
