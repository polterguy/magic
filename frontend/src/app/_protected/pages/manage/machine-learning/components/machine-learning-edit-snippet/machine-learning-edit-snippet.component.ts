
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';

/**
 * Helper component to edit details of one single training item.
 */
@Component({
  selector: 'app-machine-learning-edit-snippet',
  templateUrl: './machine-learning-edit-snippet.component.html',
  styleUrls: ['./machine-learning-edit-snippet.component.scss']
})
export class MachineLearningEditSnippetComponent implements OnInit {

  type: string = null;
  types: string[] = [];
  prompt: string;
  completion: string;
  pushed: boolean;
  hlReady: boolean = false;
  hlModel: HlModel;

  constructor(
    private dialogRef: MatDialogRef<MachineLearningEditSnippetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.prompt = this.data?.prompt;
    this.completion = this.data?.completion;
    this.type = this.data?.type;
    this.pushed = this.data?.pushed > 0 ? true : false;

    this.generalService.showLoading();

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (result: any[]) => {

        this.generalService.hideLoading();
        this.types = result.map(x => x.type);

        if (!this.data?.type) {

          // Defaulting to first type we can find.
          this.type = this.types[0];
        }
        this.typeChanged();
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to delete your snippet', 'errorMessage');
      }
    });
  }

  typeChanged() {

    // Checking if training snippet is Hyperlambda, at which point we display CodeMirror editor for content.
    if (this.type === 'hl') {
      const res = this.codemirrorActionsService.getActions(null, 'hl');
      res.autofocus = false;
      this.hlModel = {
        hyperlambda: this.completion,
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

    const data: any = {
      prompt: this.prompt,
      completion: this.type === 'hl' ? this.hlModel.hyperlambda : this.completion,
      type: this.type,
      pushed: this.pushed ? 1 : 0,
    };
    if (this.data) {
      data.id = this.data.id;
    }
    this.dialogRef.close(data);
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
