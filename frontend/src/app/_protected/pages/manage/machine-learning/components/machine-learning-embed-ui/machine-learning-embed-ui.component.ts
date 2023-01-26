
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper component to create HTML required to embed chatbot in HTML.
 */
@Component({
  selector: 'app-machine-learning-embed-ui',
  templateUrl: './machine-learning-embed-ui.component.html'
})
export class MachineLearningEmbedUiComponent implements OnInit {

  type: string = 'default';

  constructor(
    private clipboard: Clipboard,
    private backendService: BackendService,
    private openAiService: OpenAIService,
    private generalService: GeneralService) { }

  ngOnInit() {

    // Retrieving all themes from the backend.
    this.openAiService.themes().subscribe({
      next: (themes: string[]) => {

        console.log(themes);
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  embed() {

    this.clipboard.copy(`<script src="${this.backendService.active.url}/magic/system/openai/include-javascript?file=default&type=${encodeURIComponent(this.type)}&header=Ask%20and%20you%20shall%20be%20given%20an%20answer&button=Chat%20with%20AI" defer></script>`);
    this.generalService.showFeedback('JavaScript inclusion for your AI bot can be found on your clipboard');
  }
}
