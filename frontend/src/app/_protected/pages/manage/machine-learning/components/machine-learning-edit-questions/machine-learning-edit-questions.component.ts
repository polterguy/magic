
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';

/**
 * Component allowing the user to edit questions for a questionnaire.
 */
@Component({
  selector: 'app-machine-learning-edit-questions',
  templateUrl: './machine-learning-edit-questions.component.html',
  styleUrls: ['./machine-learning-edit-questions.component.scss']
})
export class MachineLearningEditQuestionsComponent implements OnInit {

  ready: boolean = false;
  options: any;

  questions: string = '';

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private dialogRef: MatDialogRef<MachineLearningEditQuestionsComponent>,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    // Retrieving questions from backend.
    this.generalService.showLoading();
    this.machineLearningTrainingService.questions({
      ['questions.questionnaire.eq']: this.data.name,
    }).subscribe({

      next: (result: any[]) => {

        this.generalService.hideLoading();
        result = result || [];
        for (const idx of result) {
          this.questions += '* ' + idx.question + '\r\n';
        }
      },

      error: (error: any) => {
    
        this.generalService.hideLoading();
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
      }
    });

    // Avoiding UI glitch in CodeMirror due to not being initially visible.
    this.options = this.codemirrorActionsService.getActions(null, 'md');
    setTimeout(() => {

      this.ready = true;
    }, 250);
  }

  save() {

    // Upserting questions.
    this.generalService.showLoading();
    this.machineLearningTrainingService.questions_upsert(this.data.name, this.questions).subscribe({

      next: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Questions successfully saved', 'successMessage', 'Ok', 2000);
        this.dialogRef.close();
      },

      error: (error: any) => {
    
        this.generalService.hideLoading();
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
      }
    });
  }
}
