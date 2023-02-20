
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper wizard component to create a chatbot rapidly, guiding the user through all
 * required steps.
 */
@Component({
  selector: 'app-chatbot-wizard',
  templateUrl: './chatbot-wizard.component.html',
  styleUrls: ['./chatbot-wizard.component.scss']
})
export class ChatbotWizardComponent implements OnInit {

  isLoading: boolean = true;
  apiKey: string = null;
  siteKey: string = null;
  secret: string = null;
  configured: boolean = false;
  isSaving: boolean = false;

  constructor(
    private openAIService: OpenAIService,
    private backendService: BackendService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.openAIService.key().subscribe({
      next: (result: any) => {

        this.apiKey = result.result;

        this.backendService.getReCaptchaKeySecret().subscribe({
          next: (result: any) => {

            this.siteKey = result.key;
            this.secret = result.secret;
            this.generalService.hideLoading();
            this.isLoading = false;
            this.configured = this.apiKey?.length > 0 && this.siteKey?.length > 0 && this.secret?.length > 0;
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
            this.isLoading = false;
          }
        });
        this.generalService.hideLoading();
        this.isLoading = false;
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
        this.isLoading = false;
      }
    });
  }

  saveConfiguration() {

    this.isSaving = true;
    this.generalService.showLoading();
    this.openAIService.setKey(this.apiKey).subscribe({
      next: () => {

        this.backendService.setReCaptchaKeySecret(this.siteKey, this.secret).subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('API key and reCAPTCHA settings successfully applied', 'successMessage');
            this.isSaving = false;
            this.configured = true;
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
            this.isSaving = false;
          }
        });
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to check if OpenAI API key is configured', 'errorMessage');
        this.isSaving = false;
      }
    });
  }

  createBot() {

    console.log('create bot');
  }
}
