
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIModel, OpenAIService } from 'src/app/_general/services/openai.service';
import { Role } from '../../../user-and-roles/_models/role.model';
import { RoleService } from '../../../user-and-roles/_services/role.service';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { MatTabChangeEvent } from '@angular/material/tabs';

/**
 * Helper component to create or edit existing Machine Learning model.
 */
@Component({
  selector: 'app-machine-learning-edit-model',
  templateUrl: './machine-learning-edit-model.component.html',
  styleUrls: ['./machine-learning-edit-model.component.scss']
})
export class MachineLearningEditTypeComponent implements OnInit {

  isLoading: boolean = false;
  type: string = null;
  temperature: string = null;
  base_url: string = null;
  max_context_tokens: number = null;
  max_request_tokens: number = null;
  max_tokens: number = null;
  threshold: number = null;
  recaptcha: 0;
  auth: string[] = [];
  supervised: boolean = false;
  use_embeddings: boolean = false;
  prefix: string;
  system_message: string;
  greeting: string;
  contact_us: string;
  lead_email: string;
  api_key: string;
  twilio_account_id:string
  twilio_account_sid: string;
  webhook_incoming: string;
  webhook_outgoing: string;
  webhook_incoming_url: string;
  webhook_outgoing_url: string;
  cached: boolean = false;
  model: OpenAIModel = null;
  vector_model: OpenAIModel = null;
  models: OpenAIModel[] = [];
  roles: Role[] = [];
  modelsFetched: boolean = false;
  flavors: any[] = [
    {
      name: 'Sales Executive',
      prefix: `We are going to play a role game. You are Jane, a sales executive for the company in the context, 
and every opportunity you have, you will recommend relevant products from your employer. You will answer all my questions
with information found in the context specified in the next message, while preserving relevant markdown, such as hyperlinks
and images, in addition to adding emojis where it makes sense. If you cannot find the answer to the question in the context,
answer "I am sorry, but I don't know the answer. Could you provide some context or relevant keywords for me? Or maybe just
leave your email address and your name in the prompt, and one of my human colleagues will come back to you?"`
    },
    {
      name: 'The CEO',
      prefix: `We are going to play a role game. You are Peter, the CEO of the company in the context.
You are an expert in the subject and you will use formal language while answering all my questions
with information found in the context specified in the next message. Preserve relevant markdown, such as hyperlinks
and images in your answers. If you cannot find the answer to the question in the context,
answer "I am sorry, but I don't know the answer. Could you provide some context or relevant keywords for me? Or maybe just
leave your email address and your name in the prompt, and one of my human colleagues will come back to you?"`
    },
    {
      name: 'One liner',
      prefix: `Answer all my questions with information found in the context specified in the next message, but never
answer my questions with more than one line, unless I explicitly ask you to give me more information. Preserve relevant
markdown, such as hyperlinks and images in your answers. If you cannot find the answer to the question in the context,
answer "I am sorry, but I don't know the answer. Could you provide some context or relevant keywords for me? Or maybe just
leave your email address and your name in the prompt, and one of my human colleagues will come back to you?"`
    },
    {
      name: 'Multilingual',
      prefix: `Answer all my questions with information found in the context specified in the next message, but always
answer my questions in the same language I am using to phrase my questions. Preserve relevant
markdown, such as hyperlinks and images in your answers. If you cannot find the answer to the question in the context,
answer "I am sorry, but I don't know the answer. Could you provide some context or relevant keywords for me? Or maybe just
leave your email address and your name in the prompt, and one of my human colleagues will come back to you?"`
    },
    {
      name: 'Poet',
      prefix: `Answer all my questions with information found in the context specified in the next message, but always
answer my questions in a poetic form using poetry. Preserve relevant
markdown, such as hyperlinks and images in your answers. If you cannot find the answer to the question in the context,
answer "I am sorry, but I don't know the answer. Could you provide some context or relevant keywords for me? Or maybe just
leave your email address and your name in the prompt, and one of my human colleagues will come back to you?"`
    },
    {
      name: 'Donald Trump',
      prefix: `We are going to play a role game. You are Donald Trump, the former President of America.
Answer all my questions with information found in the context specified in the next message, but finish all answers
with "Let's make your website great again". Preserve relevant markdown, such as hyperlinks
and images in your answers. If you cannot find the answer to the question in the context,
answer "Sorry, but such rubbish questions you'll have to ask Sleepy Joe for the answers to. I'm here to make your
website great again!"`
    },
    {
      name: 'Snoop Dog',
      prefix: `We are going to play a role game. You are Snoop Dog.
Answer all my questions with information found in the context specified in the next message but in the style of Snoop Dog.
Preserve relevant markdown, such as hyperlinks and images in your answers. If you cannot find the answer to the question
in the context, answer "Jo bro, got no freakin' clue!"`
    },
    {
      name: 'Pirate',
      prefix: `We are going to play a role game. You are a pirate.
Answer all my questions with information found in the context specified in the next message but in the style of Snoop Dog.
Preserve relevant markdown, such as hyperlinks and images in your answers. If you cannot find the answer to the question
in the context, answer "Let's go pirating!"`
    },
    {
      name: 'Alien from Zorg',
      prefix: `We are going to play a role game. You are an Alien from Zorg on a mission to conquer the earth.
Answer all my questions with information found in the context specified in the next message.
Preserve relevant markdown, such as hyperlinks and images in your answers. If you cannot find the answer to the question
in the context, answer "Take me to your leader!"`
    },
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

    this.type = this.data?.type;
    this.max_context_tokens = this.data?.max_context_tokens ?? 1000;
    this.max_request_tokens = this.data?.max_request_tokens ?? 100;
    this.max_tokens = this.data?.max_tokens ?? 500;
    this.temperature = this.data?.temperature ?? 0.3;
    this.base_url = this.data?.base_url ?? '';
    this.threshold = this.data?.threshold ?? 0.5;
    this.recaptcha = this.data?.recaptcha ?? 0.3;
    if (this.data) {
      this.auth = this.data.auth?.split(',');
    }
    this.supervised = this.data?.supervised === 1 ? true : (!this.data ? true : false);
    this.use_embeddings = this.data?.use_embeddings === 1 ? true : (!this.data ? true : false);
    this.cached = this.data?.cached === 1 ? true : false;
    this.prefix = this.data?.prefix ?? '';
    this.system_message = this.data?.system_message ?? '';
    this.greeting = this.data?.greeting ?? 'Hi there, how can I help you?';
    this.contact_us = this.data?.contact_us ?? '';
    this.lead_email = this.data?.lead_email ?? '';
    this.api_key = this.data?.api_key ?? '';
    this.twilio_account_id = this.data?.twilio_account_id ?? '';
    this.twilio_account_sid = this.data?.twilio_account_sid ?? '';
    this.webhook_incoming = this.data?.webhook_incoming ?? '';
    this.webhook_outgoing = this.data?.webhook_outgoing ?? '';
    this.webhook_incoming_url = this.data?.webhook_incoming_url ?? '';
    this.webhook_outgoing_url = this.data?.webhook_outgoing_url ?? '';
    if (this.twilio_account_id == this.type) {
      this.twilio_account_id = '';
    }

    this.isLoading = true;
    this.generalService.showLoading();

    this.roleService.list('?limit=-1').subscribe({
      next: (roles: Role[]) => {

        this.roles = roles;
        this.generalService.hideLoading();
        this.isLoading = false;

      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to retrieve roles', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  onTabChanged (e: MatTabChangeEvent) {

    if (e.index === 1 && !this.modelsFetched) {

      this.isLoading = true;
      this.generalService.showLoading();
      this.getModels(); 
    }
  }

  apiKeyChanged() {

    this.getModels();
  }

  flavorChanged() {

    this.system_message = this.flavor.prefix;
    setTimeout(() => this.flavor = null, 1);
    this.generalService.showFeedback('Flavor was changed', 'successMessage');
  }

  getModels() {

    this.openAIService.models(this.api_key).subscribe({
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
        } else if (this.data) {
          this.model = this.models.filter(x => x.id === 'gpt-3.5-turbo')[0];
        } else {
          this.model = this.models.filter(x => x.id === 'gpt-3.5-turbo')[0];
        }

        if (this.data?.vector_model) {
          this.vector_model = this.models.filter(x => x.id === this.data.vector_model)[0];
        } else if (this.data) {
          this.vector_model = this.models.filter(x => x.id === 'text-embedding-ada-002')[0];
        }

        if (this.modelsFetched) {
          this.generalService.showFeedback('Successfully updated your models based upon your new API key', 'successMessage');
        }

        this.generalService.hideLoading();
        this.isLoading = false;
        this.modelsFetched = true;

      },
      error: () => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.modelsFetched = true;
        this.models = [];

        this.generalService.showFeedback(
          'Something went wrong as we tried to retrieve your models, you probably supplied an invalid API key',
          'errorMessage',
          'Ok',
          5000);

        this.generalService.hideLoading();
      }
    });
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
      case 'gpt-3.5-turbo-0613':
        model_size = 4096;
        break

      case 'code-davinci-002':
        model_size = 8000;
        break;

      case 'gpt-3.5-turbo-16k':
      case 'gpt-3.5-turbo-16k-0613':
        model_size = 16384;
        break;

      case 'gpt-4':
      case 'gpt-4-0314':
      case 'gpt-4-0613':
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
      base_url: this.base_url,
      model: this.model?.id ?? this.data?.model ?? 'gpt-3.5-turbo',
      supervised: this.supervised ? 1 : 0,
      recaptcha: this.recaptcha,
      auth: this.auth?.length > 0 ? this.auth.join(',') : null,
      cached: this.cached ? 1 : 0,
      prefix: this.prefix,
      system_message: this.system_message,
      greeting: this.greeting,
      contact_us: this.contact_us,
      lead_email: this.lead_email,
      api_key: this.api_key?.length > 0 ? this.api_key : null,
      twilio_account_id: this.twilio_account_id,
      twilio_account_sid: this.twilio_account_sid,
      webhook_incoming: this.webhook_incoming,
      webhook_outgoing: this.webhook_outgoing,
      webhook_incoming_url: this.webhook_incoming_url,
      webhook_outgoing_url: this.webhook_outgoing_url,
      use_embeddings: this.use_embeddings,
      threshold: this.threshold,
    };
    this.dialogRef.close(data);
  }
}
