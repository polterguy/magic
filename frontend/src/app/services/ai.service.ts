
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Injectable } from '@angular/core';
import { VocabularyService } from 'src/app/services/vocabulary.service';
import { BazarService } from './bazar.service';
import { GeneralService } from './general.service';
import { MessageService } from './message.service';
import { MagicCaptcha } from './magiccaptcha.service';

/**
 * AI service for invoking the backend or the bazar to use some sort of AI function.
 */
@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(
    private generalService: GeneralService,
    private magicCaptcha: MagicCaptcha,
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
    this.magicCaptcha.token('ab6dee9ac317fcb8df3cb752fc2937345a08cb70b2f009b220ad4cb61d97029f', (token: string) => {

      this.bazarService.prompt(prompt, token).subscribe({
        next: (result: any) => {

          this.generalService.hideLoading();
          const completion = result.result.split('---')[0];
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
    });
  }
}
