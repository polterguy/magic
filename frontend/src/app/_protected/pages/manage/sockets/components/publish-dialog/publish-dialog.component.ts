
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Message } from 'src/app/models/message.model';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import { GeneralService } from 'src/app/_general/services/general.service';
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';

/**
 * Message wrapper for what message to publish.
 */
export class MessageWrapper {

  /**
   * the actual message to publish.
   */
  message?: Message;

  /**
   * Client/connection to publish it to.
   */
  client?: string;

  /**
   * Groups to publish it to.
   */
  groups?: string

  /**
   * Roles to publish it to.
   */
  roles?: string;
}

/**
 * Helper component to vide, debug and publish socket messages.
 */
@Component({
  selector: 'app-publish-dialog',
  templateUrl: './publish-dialog.component.html'
})
export class PublishDialogComponent implements OnInit {

  options: any = null;
  codemirrorIsReady: boolean = false;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<PublishDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageWrapper,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {
    this.getCodeMirrorOptions();
  }

  send() {
    if (!this.good()) {
      this.generalService.showFeedback('Your code is not valid', 'errorMessage');
      return;
    }
    // Closing dialog making sure we provide data to caller.
    this.dialogRef.close(this.data);
  }

  good() {

    // A bit of a hack, but it works.
    try {
      JSON.parse(this.data.message.content);
      if (this.data.message.name === null || this.data.message.name === '') {
        return false;
      }
      if ([this.data.client, this.data.groups, this.data.roles].filter(x => x !== null && x !== '').length > 1) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /*
   * Private helper methods.
   */

  private getCodeMirrorOptions() {
    const res = this.codemirrorActionsService.getActions(null, 'json');
    res.autofocus = false;
    this.options = res;
    setTimeout(() => {
      this.codemirrorIsReady = true;
    }, 500);
  }
}
