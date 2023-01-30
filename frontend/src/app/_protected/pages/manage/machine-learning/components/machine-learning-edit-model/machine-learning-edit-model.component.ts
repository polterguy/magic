
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIModel, OpenAIService } from 'src/app/_general/services/openai.service';
import { Role } from '../../../user-and-roles/_models/role.model';
import { RoleService } from '../../../user-and-roles/_services/role.service';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';

/**
 * Helper component to create or edit existing Machine Learning model.
 */
@Component({
  selector: 'app-machine-learning-edit-model',
  templateUrl: './machine-learning-edit-model.component.html'
})
export class MachineLearningEditTypeComponent implements OnInit {

  type: string = null;
  temperature: string = null;
  max_tokens: string = null;
  threshold: number = 0.8;
  recaptcha: 0;
  auth: string[] = [];
  supervised: boolean = false;
  use_embeddings: boolean = false;
  prefix: string;
  cached: boolean = false;
  model: OpenAIModel = null;
  models: OpenAIModel[] = [];
  roles: Role[] = [];

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private roleService: RoleService,
    private dialogRef: MatDialogRef<MachineLearningEditTypeComponent>,) { }

  ngOnInit() {

    this.type = this.data?.type;
    this.max_tokens = this.data?.max_tokens ?? 2000;
    this.temperature = this.data?.temperature ?? 0.1;
    this.threshold = this.data?.threshold ?? 0.8;
    this.recaptcha = this.data?.recaptcha ?? 0;
    if (this.data) {
      this.auth = this.data.auth?.split(',');
    }
    this.supervised = this.data?.supervised === 1 ? true : (!this.data ? true : false);
    this.use_embeddings = this.data?.use_embeddings === 1 ? true : (!this.data ? true : false);
    this.cached = this.data?.cached === 1 ? true : false;
    this.prefix = this.data?.prefix ?? '';

    this.generalService.showLoading();

    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {

        this.roles = roles;

        this.openAIService.models().subscribe({
          next: (models: OpenAIModel[]) => {
    
            this.models = models;
            this.models.sort((lhs: OpenAIModel, rhs: OpenAIModel) => {
              if (lhs.id < rhs.id) {
                return -1;
              }
              if (lhs.id > rhs.id) {
                return 1;
              }
              return 0;
            });

            if (this.data?.model) {
              this.model = this.models.filter(x => x.id === this.data.model)[0];
            } else {
              this.model = this.models.filter(x => x.id === 'text-davinci-003')[0];
            }
            this.generalService.hideLoading();
          },
          error: () => {
    
            this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage');
            this.generalService.hideLoading();
          }
        });
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  supervisedChanged() {

    if (!this.supervised) {
      this.cached = false;
    }
  }

  save() {

    if (!this.type || this.type.length < 2) {
      this.generalService.showFeedback('You need to provide a type name', 'errorMessage');
      return;
    }

    const data: any = {
      type: this.type,
      max_tokens: this.max_tokens,
      temperature: this.temperature,
      model: this.model.id,
      supervised: this.supervised ? 1 : 0,
      recaptcha: this.recaptcha,
      auth: this.auth?.length > 0 ? this.auth.join(',') : null,
      cached: this.cached ? 1 : 0,
      prefix: this.prefix,
      use_embeddings: this.use_embeddings,
      threshold: this.threshold,
    };
    this.dialogRef.close(data);
  }
}
