
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Response } from 'src/app/models/response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper component to test model.
 */
@Component({
  selector: 'app-machine-learning-test',
  templateUrl: './machine-learning-test.component.html',
  styleUrls: ['./machine-learning-test.component.scss']
})
export class MachineLearningTestComponent {

  prompt: string = '';
  completion: string = 'Result ...';
  isLoading: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,) { }

  submit() {

    this.generalService.showLoading();
    this.isLoading = true;
    this.openAIService.query(this.prompt, this.data.type).subscribe({
      next: (result: Response) => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.completion = result.result;
      },
      error: () => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.generalService.showFeedback('Something went wrong as we tried to create your type', 'errorMessage');
      }
    });
  }
}
