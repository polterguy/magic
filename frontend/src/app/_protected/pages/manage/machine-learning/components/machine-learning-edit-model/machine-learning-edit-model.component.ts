
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

  isLoading: boolean = false;
  advanced: boolean = false;
  type: string = null;
  temperature: string = null;
  max_context_tokens: number = null;
  max_request_tokens: number = null;
  max_tokens: number = null;
  threshold: number = null;
  recaptcha: 0;
  auth: string[] = [];
  supervised: boolean = false;
  use_embeddings: boolean = false;
  prefix: string;
  cached: boolean = false;
  model: OpenAIModel = null;
  vector_model: OpenAIModel = null;
  models: OpenAIModel[] = [];
  roles: Role[] = [];
  flavors: any[] = [
    {name: 'Sales Executive', prefix: 'Answer the following as if you are a Sales Executive in the subject: '},
    {name: 'The CEO', prefix: 'Answer the following as if you are the CEO of the company: '},
    {name: 'The Expert', prefix: 'Answer the following as if you are an expert in the subject: '},
    {name: 'Explain as if I am 5', prefix: 'Answer the following and explain it as if I am 5 years old: '},
    {name: 'One liner', prefix: 'Answer the following with one sentence: '},
    {name: 'Two liner', prefix: 'Answer the following with two sentences: '},
    {name: 'Three liner', prefix: 'Answer the following with three sentences: '},
    {name: 'One paragraph', prefix: 'Answer the following with one paragraph: '},
    {name: 'Multilingual', prefix: 'Answer the following question in the same language: '},
    {name: 'Poet', prefix: 'Answer the following with a poem: '},
    {name: 'Donald Trump', prefix: 'Answer the following in the style of Donald Trump: '},
    {name: 'Joe Biden', prefix: 'Answer the following in the style of Joe Biden: '},
    {name: 'Snoop Dog', prefix: 'Answer the following in the style of Snoop Dog: '},
    {name: 'Bob Marley', prefix: 'Answer the following in the style of Bob Marley: '},
    {name: 'Pirate', prefix: 'Answer the following in the style of a Pirate: '},
    {name: 'Alien from Zorg', prefix: 'Answer the following as if you are an alien from the planet Zorg who came to teach humans about superior technology: '},
    {name: 'Reddit Troll', prefix: 'Answer the following as if you are a Reddit troll: '},
  ];
  flavor: any = null;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private roleService: RoleService,
    private dialogRef: MatDialogRef<MachineLearningEditTypeComponent>,) { }

  ngOnInit() {

    this.isLoading = true;
    this.type = this.data?.type;
    this.max_context_tokens = this.data?.max_context_tokens ?? 1000;
    this.max_request_tokens = this.data?.max_request_tokens ?? 100;
    this.max_tokens = this.data?.max_tokens ?? 500;
    this.temperature = this.data?.temperature ?? 0.3;
    this.threshold = this.data?.threshold ?? 0.8;
    this.recaptcha = this.data?.recaptcha ?? 0.3;
    if (this.data) {
      this.auth = this.data.auth?.split(',');
    }
    this.supervised = this.data?.supervised === 1 ? true : (!this.data ? true : false);
    this.use_embeddings = this.data?.use_embeddings === 1 ? true : (!this.data ? true : false);
    this.cached = this.data?.cached === 1 ? true : false;
    this.prefix = this.data?.prefix ?? '';
    this.advanced = !!this.data;

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
              this.model = this.models.filter(x => x.id === 'gpt-3.5-turbo')[0];
            }

            if (this.data?.vector_model) {
              this.vector_model = this.models.filter(x => x.id === this.data.vector_model)[0];
            } else {
              this.vector_model = this.models.filter(x => x.id === 'text-embedding-ada-002')[0];
            }
            this.generalService.hideLoading();
            this.isLoading = false;
          },
          error: () => {
    
            this.generalService.showFeedback('Something went wrong as we tried to retrieve your models', 'errorMessage');
            this.generalService.hideLoading();
          }
        });
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to retrieve roles', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  flavorChanged() {

    this.prefix = this.flavor.prefix;
    setTimeout(() => this.flavor = null, 1);
    this.generalService.showFeedback('Flavor was changed', 'successMessage');
  }

  modelChanged() {

    if (this.model?.id?.startsWith('gpt-')) {
      this.prefix = '';
    } else if (this.use_embeddings) {
      this.prefix = 'Answer the following QUESTION while using the information in the following CONTEXT. If you cannot answer the question using the specified CONTEXT then answer "I don\'t know the answer, try to be more specific.".\r\n\r\nQUESTION: [QUESTION]\r\n\r\nCONTEXT: [CONTEXT]\r\n\r\nANSWER:';
    }
  }

  supervisedChanged() {

    if (!this.supervised) {
      this.cached = false;
    }
  }

  getMessageTokens() {

    let model_size = 0;
    switch (this.model?.id ?? '') {

      case 'text-davinci-003':
      case 'gpt-3.5-turbo':
      case 'gpt-3.5-turbo-0301':
      case 'text-davinci-002':
        model_size = 4096;
        break

      case 'code-davinci-002':
        model_size = 8000;
        break;

      case 'gpt-4':
      case 'gpt-4-0314':
        model_size = 8192;
        break;

      case 'gpt-4-32k':
      case 'gpt-4-32k-0314':
        model_size = 32768;
        break;

      default:
        model_size = 2049;
        break;
    }
    const context_size = this.use_embeddings ? (this.max_context_tokens ?? 0) : 0;
    return model_size - ((this.max_tokens ?? 0) + (this.max_request_tokens ?? 0) + context_size);
  }

  save() {

    if (!this.type || this.type.length < 2) {
      this.generalService.showFeedback('You need to provide a type name', 'errorMessage');
      return;
    }

    if (this.model?.id?.startsWith('gpt') && this.getMessageTokens() < 200) {
      this.generalService.showFeedback('You must reserve at last 200 tokens for messages to effectively utilise GPT models', 'errorMessage');
      return;
    }

    const data: any = {
      type: this.type,
      max_context_tokens: this.max_context_tokens,
      max_request_tokens: this.max_request_tokens,
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
