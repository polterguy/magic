
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * Helper component for importing training snippets and associating with type/model.
 */
@Component({
  selector: 'app-machine-learning-import',
  templateUrl: './machine-learning-import.component.html',
  styleUrls: ['./machine-learning-import.component.scss']
})
export class MachineLearningImportComponent {

  uploading: boolean = false;
  trainingFileModel: string = '';
  url: string = null;
  delay: number = 2;
  max: number = 200;
  prompt: string = 'prompt';
  completion: string = 'completion';
  advanced: boolean = false;
  threshold: number = 150;
  uploadIndex: number = 0;
  uploadCount: number = 0;
  files: FileList = null;
  summarize: boolean = true;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private matDialog: MatDialogRef<MachineLearningImportComponent>,
    private generalService: GeneralService,
    private openAIService: OpenAIService) { }

  importUrl() {

    if (!this.url ||
        this.url.length === 0 ||
        this.delay < 1 ||
        this.max > 2500 ||
        this.threshold < 25 ||
        !this.CommonRegEx.domain.test(this.url)) {

      this.generalService.showFeedback('Not valid input', 'errorMessage');
      return;
    }

    if (this.url.endsWith('/')) {
      this.url = this.url.substring(0, this.url.length - 1);
    }

    const splits = this.url.split('://');
    if (splits[0] !== 'http' && splits[0] !== 'https' && splits.length !== 2) {

      this.generalService.showFeedback('Provide a domain name with its http(s) prefix', 'errorMessage');
      return;
    }
    if (splits[1].includes('/')) {

      this.generalService.showFeedback('For now we only support domains', 'errorMessage');
      return;
    }

    this.matDialog.close({ crawl: this.url, delay: this.delay * 1000, max: this.max, threshold: this.threshold, summarize: this.summarize });
  }

  getFile(event: any) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }
    this.uploading = true;
    this.uploadIndex = 0;
    this.uploadCount = 0;
    this.files = event.target.files;
    this.uploadCurrentFile();
  }

  getFileName() {

    if (!this.files || this.files.length === 0 || this.uploadIndex >= this.files.length) {
      return '';
    }
    return this.files[this.uploadIndex].name;
  }

  /*
   * Private helper methods.
   */

  private uploadCurrentFile() {

    const formData = new FormData();
    formData.append('file', this.files[this.uploadIndex], this.files[this.uploadIndex].name);
    formData.append('type', this.data.type);
    formData.append('prompt', this.prompt);
    formData.append('completion', this.completion);

    this.openAIService.uploadTrainingFile(formData).subscribe({
      next: (result: any) => {

        this.uploadCount += result.count;

        setTimeout(() => {

          // Incrementing upload index
          this.uploadIndex += 1;
          if (this.uploadIndex >= this.files.length) {
            this.generalService.showFeedback(`${this.uploadCount} training snippets successfully imported`, 'successMessage');
            this.uploading = false;
            this.trainingFileModel = '';
            this.uploadIndex = 0;
            this.files = null;
            this.matDialog.close();
            return;
          }

          // More files remaining.
          this.uploadCurrentFile();
        }, 100);
      },
      error: (error: any) => {

        this.uploading = false;
        this.trainingFileModel = '';
        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
