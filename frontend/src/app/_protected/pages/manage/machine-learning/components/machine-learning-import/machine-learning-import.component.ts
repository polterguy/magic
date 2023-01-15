
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper component for importing training snippets and associating with type/model.
 */
@Component({
  selector: 'app-machine-learning-import',
  templateUrl: './machine-learning-import.component.html',
  styleUrls: ['./machine-learning-import.component.scss']
})
export class MachineLearningImportComponent implements OnInit {

  uploading: boolean = false;
  trainingFileModel: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,) { }

  ngOnInit() {
  }

  getFile(event: any) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }

    this.uploading = true;

    const formData = new FormData();
    formData.append("file", event.target.files[0], event.target.files[0].name);
    formData.append("type", this.data.type);

    this.openAIService.uploadTrainingFile(formData).subscribe({
      next: () => {

        this.uploading = false;
        this.generalService.showFeedback('Training data successfully uploaded', 'successMessage');

        // Giving user some time to register feedback.
        setTimeout(() => this.trainingFileModel = '', 2000);
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  getFileName() {
    return this.trainingFileModel.split('\\').pop().split('/').pop();
  }
}
