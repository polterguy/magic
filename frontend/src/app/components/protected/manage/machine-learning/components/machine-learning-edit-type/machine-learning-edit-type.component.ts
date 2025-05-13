
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { CommonRegEx } from 'src/app/helpers/common-regex';
import { GeneralService } from 'src/app/services/general.service';
import { Role } from '../../../user-and-roles/_models/role.model';
import { BackendService } from 'src/app/services/backend.service';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { OpenAIModel, OpenAIService } from 'src/app/services/openai.service';
import { RoleService } from '../../../user-and-roles/_services/role.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';
import { MachineLearningCreateSystemMessage } from '../machine-learning-create-system-message/machine-learning-create-system-message.component';
import { MachineLearningAddWorkflow } from '../machine-learning-add-workflow/machine-learning-add-workflow.component';

/**
 * Helper component to create or edit existing Machine Learning model.
 */
@Component({
  selector: 'app-machine-learning-edit-type',
  templateUrl: './machine-learning-edit-type.component.html',
  styleUrls: ['./machine-learning-edit-type.component.scss']
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
  conversation_starters: string;
  greeting: string;
  contact_us: string;
  lead_email: string;
  api_key: string;
  twilio_account_id: string
  twilio_account_sid: string;
  webhook_incoming: string;
  webhook_outgoing: string;
  webhook_incoming_url: string;
  webhook_outgoing_url: string;
  initial_questionnaire: any;
  cached: boolean = false;
  model: OpenAIModel = null;
  vector_model: OpenAIModel = null;
  models: OpenAIModel[] = [];
  roles: Role[] = [];
  modelsFetched: boolean = false;
  questionnaires: any[] = [];
  search_postfix: string;
  no_requests: number;
  max_requests: number;
  flavors: any[] = [];
  flavor: any = null;
  hasRecaptcha: boolean = false;
  max_function_invocations: number = 25;
  max_session_items: number = 15;
  completion_slots: string[] = [];
  completion_slot: string = '';
  model_max_tokens: number = null;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private roleService: RoleService,
    private backendService: BackendService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private dialogRef: MatDialogRef<MachineLearningEditTypeComponent>) { }

  ngOnInit() {

    this.type = this.data?.type;
    if (this.data?.model) {
      this.model = {
        id: this.data?.model,
      };
    }
    this.max_context_tokens = this.data?.max_context_tokens ?? 12000;
    this.max_request_tokens = this.data?.max_request_tokens ?? 1000;
    this.max_tokens = this.data?.max_tokens ?? 4000;
    this.temperature = this.data?.temperature ?? 0.3;
    this.base_url = this.data?.base_url ?? '';
    this.threshold = this.data?.threshold ?? 0.3;
    this.recaptcha = this.data?.recaptcha ?? 0;
    if (this.data) {
      this.auth = this.data.auth?.split(',');
    }
    this.supervised = this.data?.supervised === 1 ? true : (!this.data ? true : false);
    this.use_embeddings = this.data?.use_embeddings === 1 ? true : (!this.data ? true : false);
    this.cached = this.data?.cached === 1 ? true : false;
    this.prefix = this.data?.prefix ?? '';
    this.system_message = this.data?.system_message ?? 'You are a helpful assistant, and you will answer the users questions based upon the information found in your context';
    this.conversation_starters = this.data?.conversation_starters ?? (this.data ? '' : `* What can I ask you about?
* How do I contact you?
* Who created this chatbot?`);
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
    this.no_requests = this.data?.no_requests ?? 0;
    this.search_postfix = this.data?.search_postfix ?? '';
    this.max_requests = this.data?.max_requests ?? -1;
    if (this.twilio_account_id == this.type) {
      this.twilio_account_id = '';
    }
    this.max_function_invocations = this.data?.max_function_invocations ?? 5;
    this.max_session_items = this.data?.max_session_items ?? 15
    this.completion_slot = this.data?.completion_slot ?? 'magic.ai.chat';

    this.isLoading = true;
    this.generalService.showLoading();

    this.backendService.getReCaptchaKeySecret().subscribe({

      next: (reCaptcha: any) => {

        this.hasRecaptcha = reCaptcha.key?.length > 0 && reCaptcha.secret?.length > 0;

        if (!this.hasRecaptcha && this.recaptcha > 0) {
          this.recaptcha = 0;
        }

        this.roleService.list('?limit=-1').subscribe({

          next: (roles: Role[]) => {
    
            this.roles = roles;
            this.machineLearningTrainingService.questionnaires().subscribe({
    
              next: (result: any[]) => {

                this.questionnaires = result || [];
                if (result && result.length > 0 && this.data?.initial_questionnaire) {
                  this.initial_questionnaire = this.questionnaires.filter(x => x.name === this.data?.initial_questionnaire)[0];
                }

                this.openAIService.getSystemMessage().subscribe({

                  next: (result: any[]) => {

                    result = result.sort((lhs: any, rhs: any) => {
                      if (lhs.name.includes('DYNAMIC')) {
                        return -1;
                      }
                      else if (rhs.name.includes('DYNAMIC')) {
                        return 1;
                      }
                      return 0;
                    });
        
                    this.flavors = result;
                    this.generalService.hideLoading();
                    this.isLoading = false;

                  },

                  error: () => {

                    this.isLoading = false;
                    this.generalService.showFeedback('Something went wrong as we tried to retrieve standard system messages', 'errorMessage');
                    this.generalService.hideLoading();
                  }
                });
              },
        
              error: () => {

                this.isLoading = false;
                this.generalService.showFeedback('Something went wrong as we tried to retrieve questionnaires', 'errorMessage');
                this.generalService.hideLoading();
              }
            });
          },
    
          error: () => {
    
            this.generalService.showFeedback('Something went wrong as we tried to retrieve reCAPTCHA settings', 'errorMessage');
            this.generalService.hideLoading();
          }
        });
      },

      error: () => {

        this.isLoading = false;
        this.generalService.showFeedback('Something went wrong as we tried to check if reCAPTCHA has been configured for your cloudlet', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  onTabChanged (e: MatTabChangeEvent) {

    if (e.index === 1 && !this.modelsFetched) {

      this.generalService.showLoading();
      this.isLoading = true;
      this.getModels(() => {
        if (e.index === 1 && this.completion_slots.length === 0) {

          this.openAIService.completionSlots().subscribe({
    
            next: (llms: any) => {
    
              this.completion_slots = llms.llms;
              this.isLoading = false;
              this.generalService.hideLoading();
            },
    
            error: () => {
    
              this.isLoading = false;
              this.generalService.showFeedback('Something went wrong as we tried to retrieve standard system messages', 'errorMessage');
              this.generalService.hideLoading();
            }
          });
        }
      }); 
    }
  }

  apiKeyChanged() {

    this.getModels();
  }

  completionSlotChanged() {

    if (this.completion_slot === 'magic.ai.chat') {
      this.model_max_tokens = null;
      return;
    }
    this.isLoading = true;
    this.generalService.showLoading();
    this.openAIService.maxTokensForCompletionSlot(this.completion_slot).subscribe({

      next: (result: any) => {

        this.model_max_tokens = result.max_tokens;
        this.generalService.hideLoading();
        this.isLoading = false;
      },

      error: () => {

        this.generalService.showFeedback('Could not retrieve maximum tokens for completion slot, missing configuration section');
        this.generalService.hideLoading();
        this.isLoading = false;
      }
    });
  }

  flavorChanged() {

    this.system_message = this.flavor.prefix;
    if (this.flavor.max_context_tokens) {
      this.max_context_tokens = this.flavor.max_context_tokens;
    }
    if (this.flavor.max_function_invocations) {
      this.max_function_invocations = this.flavor.max_function_invocations;
    }
    while (this.system_message.includes('YOUR_TYPE_NAME_HERE')) {
      this.system_message = this.system_message.replace('YOUR_TYPE_NAME_HERE', this.type);
    }

    // Checking if this is a template system message.
    if (this.system_message.includes('[[') && this.flavor.instruction && this.flavor.name.includes('DYNAMIC')) {

      this.dialog.open(MachineLearningCreateSystemMessage, {
        width: '80vw',
        maxWidth: '550px',
        data: {
          instruction: this.flavor.instruction,
          template: this.flavor.prefix,
        }
      })
      .afterClosed()
      .subscribe((result: {message: string}) => {

        if (result?.message) {
          this.system_message = result.message;
        }
        this.generalService.showFeedback('System message was changed, remember to save your type', 'successMessage');
      });
    } else if (this.system_message.includes('[TYPE_NAME_HERE]')) {

      this.system_message = this.system_message.replace('[TYPE_NAME_HERE]', this.type);

    } else {

      this.generalService.showFeedback('System message was changed, remember to save your type', 'successMessage');
    }
    setTimeout(() => this.flavor = null, 1);
  }

  getModels(onAfter: () => void = null) {

    this.openAIService.models(this.api_key).subscribe({

      next: (models: OpenAIModel[]) => {

        this.models = models.filter(x => x.chat === true || x.vector === true);
        this.models.sort((lhs: OpenAIModel, rhs: OpenAIModel) => {
          if (lhs.created < rhs.created) {
            return 1;
          }
          if (lhs.created > rhs.created) {
            return -1;
          }
          return 0;
        });

        if (this.data?.model) {
          this.model = this.models.filter(x => x.id === this.data.model)[0];
        } else {
          const gpt4 = this.models.filter(x => x.id === 'gpt-4.1-2025-04-14');
          if (gpt4.length > 0) {
            this.model = gpt4[0];
          } else {
            this.model = this.models.filter(x => x.id === 'gpt-3.5-turbo')[0];
          }
        }
        if (this.model.id.startsWith('gpt')) {
          this.cached = false;
        }

        if (this.data?.vector_model) {
          this.vector_model = this.models.filter(x => x.id === this.data.vector_model)[0];
        } else {
          this.vector_model = this.models.filter(x => x.id === 'text-embedding-ada-002')[0];
        }

        if (this.modelsFetched) {
          this.generalService.showFeedback('Successfully updated your models based upon your new API key', 'successMessage');
        }

        this.modelsFetched = true;
        if (onAfter) {
          onAfter();
        }
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

  getVectorModels() {

    return this.models.filter(x => x.vector === true);
  }

  getChatModels() {

    return this.models.filter(x => x.chat === true);
  }

  modelChanged() {

    if (this.model?.id?.startsWith('gpt-') || this.model?.id?.startsWith('o3-')) {
      this.prefix = '';
      this.cached = false;
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

    let model_size = this.model?.tokens;
    if (this.model_max_tokens) {
      model_size = this.model_max_tokens;
    }
    const context_size = this.use_embeddings ? (this.max_context_tokens ?? 0) : 0;
    return model_size - ((this.max_tokens ?? 0) + (this.max_request_tokens ?? 0) + context_size);
  }

  addFunction() {

    this.dialog
      .open(MachineLearningAddWorkflow, {
        width: '80vw',
        maxWidth: '1100px',
        data: {
          type: this.type,
          systemInstruction: true,
        }
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          // Training data was updated.
          this.system_message = this.system_message.trimEnd();
          if (this.system_message.length > 0) {
            this.system_message += '\r\n\r\n';
          }
          this.system_message += '## ' + result.prompt + '\r\n\r\n' + result.completion;
          this.generalService.showFeedback('AI function added to your system message', 'successMessage');
        }
    });
  }

  valid() {

    if (this.max_context_tokens > 100000 || this.max_context_tokens < 500) {
      return false
    }

    if (this.max_request_tokens > 25000 || this.max_request_tokens < 100) {
      return false
    }

    if (this.max_tokens > 40000 || this.max_tokens < 500) {
      return false
    }

    return true;
  }

  save() {

    if (!this.hasRecaptcha && this.recaptcha > 0) {
      this.generalService.showFeedback('You cannot add a positive reCAPTCHA value because you don\'t have reCAPTCHA configured on the backend', 'errorMessage');
      return;
    }

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
      supervised: this.supervised ? 1 : 0,
      recaptcha: this.recaptcha,
      auth: this.auth?.length > 0 ? this.auth.join(',') : null,
      cached: this.cached ? 1 : 0,
      prefix: this.prefix,
      system_message: this.system_message,
      conversation_starters: this.conversation_starters,
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
      initial_questionnaire: this.initial_questionnaire?.name || null,
      use_embeddings: this.use_embeddings,
      threshold: this.threshold,
      no_requests: this.no_requests,
      search_postfix: this.search_postfix,
      max_requests: this.max_requests,
      max_function_invocations: this.max_function_invocations,
      max_session_items: this.max_session_items,
      completion_slot: this.completion_slot,
    };
    if (this.vector_model) {
      data.vector_model = this.vector_model.id;
    }
    if (this.model) {
      data.model = this.model.id;
    }
    this.dialogRef.close(data);
  }
}
