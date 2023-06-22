
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Injectable } from '@angular/core';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { VocabularyService } from 'src/app/_general/services/vocabulary.service';
import { BazarService } from './bazar.service';
import { GeneralService } from './general.service';
import { MessageService } from './message.service';

/**
 * Gneral service with helpers for subscribing to screen size changes, showing loader, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(
    private generalService: GeneralService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private bazarService: BazarService,
    private vocabularyService: VocabularyService,
    private messageService: MessageService) { }
  
  prompt(selection: string) {

    let prompt = '';
    const words = this.vocabularyService.words.filter(x => x === selection);
    if (words.length > 0) {
      prompt = 'How does [' + selection + '] work?';
    } else {
      prompt = 'Explain this Hyperlambda code\r\n\r\n' + selection;
    }

    this.generalService.showLoading();
    this.recaptchaV3Service.execute('aiAutoPrompt').subscribe({
      next: (token: string) => {

        this.bazarService.prompt(prompt, token).subscribe({
          next: (result: any) => {

            this.generalService.hideLoading();
            const completion = result.result;
            this.messageService.sendMessage({
              name: 'magic.show-help',
              content: completion,
            });
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Could not invoke magic API server to create completion', 'errorMessage');
          }
        });
      },
      error: () => {

        this.generalService.hideLoading();
      },
    });
  }
}
