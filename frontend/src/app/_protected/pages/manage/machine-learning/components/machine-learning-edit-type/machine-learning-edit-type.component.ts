
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
 * Helper component to create or edit existing Machine Learning type.
 */
@Component({
  selector: 'app-machine-learning-edit-type',
  templateUrl: './machine-learning-edit-type.component.html',
  styleUrls: ['./machine-learning-edit-type.component.scss']
})
export class MachineLearningEditTypeComponent implements OnInit {

  type: string = null;
  temperature: string = null;
  max_tokens: string = null;
  recaptcha: 0;
  auth: string[] = [];
  supervised: boolean = false;
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
    this.max_tokens = this.data?.max_tokens ?? 500;
    this.temperature = this.data?.temperature ?? 0.1;
    this.recaptcha = this.data?.recaptcha ?? 0;
    this.auth = this.data?.auth?.split(',') ?? ['root'];
    this.supervised = this.data?.supervised === 1 ? true : false;
    this.cached = this.data?.cached === 1 ? true : false;

    this.generalService.showLoading();

    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {

        this.roles = roles;

        this.openAIService.models().subscribe({
          next: (models: OpenAIModel[]) => {
    
            this.models = models;
            if (this.data?.model) {
              this.model = this.models.filter(x => x.id === this.data.model)[0];
            } else {
              this.model = this.models.filter(x => x.id === 'curie')[0];
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
    };
    this.dialogRef.close(data);
  }
}
