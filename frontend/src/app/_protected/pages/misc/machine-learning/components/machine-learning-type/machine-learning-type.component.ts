
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIModel, OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper component to create or edit existing Machine Learning type.
 */
@Component({
  selector: 'app-machine-learning-type',
  templateUrl: './machine-learning-type.component.html',
  styleUrls: ['./machine-learning-type.component.scss']
})
export class MachineLearningTypeComponent implements OnInit {

  type: string = null;
  temperature: string = null;
  max_tokens: string = null;
  model: OpenAIModel = null;
  models: OpenAIModel[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private dialogRef: MatDialogRef<MachineLearningTypeComponent>,) { }

  ngOnInit() {

    this.type = this.data?.type;
    this.max_tokens = this.data?.max_tokens ?? 2000;
    this.temperature = this.data?.temperature ?? 0.5;

    this.generalService.showLoading();

    this.openAIService.models().subscribe({
      next: (models: OpenAIModel[]) => {

        this.models = models;
        this.model = this.models.filter(x => x.id === 'curie')[0];
        this.generalService.hideLoading();
      },
      error: () => {
        this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  save() {

    const data: any = {
      type: this.type,
      max_tokens: this.max_tokens,
      temperature: this.temperature,
    };
    this.dialogRef.close(data);
  }
}
