
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';

/**
 * Modal dialog asking user what model he or she wants to select.
 */
@Component({
  selector: 'app-select-model-dialog',
  templateUrl: './select-model-dialog.component.html'
})
export class SelectModelDialogComponent implements OnInit {

  type: string = '';
  types: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<SelectModelDialogComponent>,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    // Retrieving all types from backend.
    this.machineLearningTrainingService.ml_types().subscribe({

      next: (result: any[]) => {

        this.types = result.map(x => x.type);
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  selectModel() {

    this.dialogRef.close({type: this.type});
  }
}
