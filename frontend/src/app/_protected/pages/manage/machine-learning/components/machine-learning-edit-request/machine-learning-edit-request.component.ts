
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';

/**
 * Helper component to edit details of one request.
 */
@Component({
  selector: 'app-machine-learning-edit-request',
  templateUrl: './machine-learning-edit-request.component.html',
  styleUrls: ['./machine-learning-edit-request.component.scss']
})
export class MachineLearningEditRequestComponent implements OnInit {

  hlReady: boolean = false;
  hlModel: HlModel;

  constructor(
    private dialogRef: MatDialogRef<MachineLearningEditRequestComponent>,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    // Checking if training snippet is Hyperlambda, at which point we display CodeMirror editor for content.
    if (this.data.type === 'hl') {
      const res = this.codemirrorActionsService.getActions(null, 'hl');
      res.autofocus = false;
      this.hlModel = {
        hyperlambda: this.data.completion,
        options: res,
      }
      setTimeout(() => {
        this.hlReady = true;
      }, 500);
    } else {
      this.hlReady = false;
    }
  }

  save() {

    this.dialogRef.close({
      id: this.data.id,
      prompt: this.data.prompt,
      completion: this.data.type === 'hl' ? this.hlModel.hyperlambda : this.data.completion,
      type: this.data.type,
    });
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
