
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';
import { GeneralService } from 'src/app/services/general.service';
import { OpenAIService } from 'src/app/services/openai.service';

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
  imageFileModel: string = '';
  trainingFileModelCsv: string = '';
  urlList: string = '';
  url: string = null;
  delay: number = 1;
  max: number = 25;
  prompt: string = 'prompt';
  completion: string = 'completion';
  massage: string = '';
  threshold: number = 150;
  uploadIndex: number = 0;
  uploadCount: number = 0;
  files: FileList = null;
  summarize: boolean = true;
  insert_url: boolean = false;
  images: boolean = true;
  code: boolean = true;
  lists: boolean = true;
  massageTemplate: string = null;
  summarizeTxtFile: boolean = true;
  vectorize: boolean = true;
  summarizePdfFile: boolean = false;
  overwrite: boolean = false;
  preservePages: boolean = false;
  massageTemplates: string[] = [
    'Summarize the following into a descriptive title and content, separated by carrriage return',
    'Extract the most important information and create a one line descriptive title, and the rest of the content as paragraphs',
    'Create structured information from the following with a one line descriptive title and the rest of the content on consecutive lines'
  ];

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private matDialog: MatDialogRef<MachineLearningImportComponent>,
    private generalService: GeneralService,
    private openAIService: OpenAIService) { }

  massageTemplateChanged() {

    this.massage = this.massageTemplate;
    this.massageTemplate = null;
  }

  importUrl() {

    if (!this.url ||
        this.url.length === 0 ||
        this.delay < 1 ||
        this.max > 10000 ||
        this.threshold < 25) {

      this.generalService.showFeedback('Not valid input', 'errorMessage');
      return;
    }

    this.matDialog.close({
      crawl: this.url,
      delay: this.delay * 1000,
      max: this.max,
      threshold: this.threshold,
      summarize: this.summarize,
      insert_url: this.insert_url,
      images: this.images,
      code: this.code,
      lists: this.lists,
    });
  }

  getFile(event: any, forceAsText: boolean = false) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }
    this.uploading = true;
    this.uploadIndex = 0;
    this.uploadCount = 0;
    this.files = event.target.files;
    this.generalService.showLoading();
    this.uploadCurrentFile(false, forceAsText);
  }

  getImageFile(event: any) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }
    this.uploading = true;
    this.uploadIndex = 0;
    this.uploadCount = 0;
    this.files = event.target.files;
    this.generalService.showLoading();
    this.uploadCurrentImageFile();
  }

  getFileCsv(event: any) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }
    this.uploading = true;
    this.uploadIndex = 0;
    this.uploadCount = 0;
    this.files = event.target.files;
    this.generalService.showLoading();
    this.uploadCurrentFile(true);
  }

  getUrlList(event: any) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }

    this.matDialog.close({
      urlFiles: event.target.files,
      vectorize: this.vectorize,
    });
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

  private uploadCurrentFile(csvFile: boolean = false, forceAsText: boolean = false) {

    const formData = new FormData();
    formData.append('file', this.files[this.uploadIndex], this.files[this.uploadIndex].name);
    formData.append('type', this.data.type);
    if (!csvFile) {
      formData.append('prompt', this.prompt);
      formData.append('completion', this.completion);
      if (forceAsText && (this.files[this.uploadIndex].name.endsWith('.csv') || this.files[this.uploadIndex].name.endsWith('.CSV'))) {
        formData.append('forceAsText', 'true');
      }
      if (this.files[this.uploadIndex].name.endsWith('.pdf')) {
        if (this.massage && this.massage !== '') {
          formData.append('massage', this.massage);
        }
        if (this.preservePages) {
          formData.append('preservePages', 'true');
        }
        if (this.summarizePdfFile) {
          formData.append('massagePrompt', 'Create a short keyword-based single descriptive sentence from the following information intended for doing VSS-based search on it later to retrieve it using RAG');
        }
        if (this.overwrite) {
          formData.append('overwrite', 'true');
        }
      } else {
        if (this.summarizeTxtFile) {
          formData.append('massagePrompt', 'Create a short keyword-based single descriptive sentence from the following information intended for doing VSS-based search on it later to retrieve it using RAG');
        }
      }
    }

    var svc = csvFile ? this.openAIService.uploadCsvFile.bind(this.openAIService) : this.openAIService.uploadTrainingFile.bind(this.openAIService);

    svc(formData).subscribe({
      next: (result: any) => {

        this.uploadCount += result.count;

        setTimeout(() => {

          // Incrementing upload index
          this.uploadIndex += 1;
          if (this.uploadIndex >= this.files.length) {
            this.generalService.hideLoading();
            this.generalService.showFeedback(`${this.uploadCount} training snippets successfully imported`, 'successMessage');
            this.uploading = false;
            if (csvFile) {
              this.trainingFileModelCsv = '';
            } else {
              this.trainingFileModel = '';
            }
            this.uploadIndex = 0;
            this.files = null;
            this.matDialog.close();
            return;
          }

          // More files remaining.
          this.uploadCurrentFile(csvFile);
        }, 100);
      },
      error: (error: any) => {

        this.uploading = false;
        if (csvFile) {
          this.trainingFileModelCsv = '';
        } else {
          this.trainingFileModel = '';
        }
        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  private uploadCurrentImageFile() {

    const formData = new FormData();
    formData.append('file', this.files[this.uploadIndex], this.files[this.uploadIndex].name);
    formData.append('type', this.data.type);

    this.openAIService.uploadImageFile(formData).subscribe({

      next: (result: any) => {

        this.uploadCount += result.count;

        setTimeout(() => {

          // Incrementing upload index
          this.uploadIndex += 1;
          if (this.uploadIndex >= this.files.length) {
            this.generalService.hideLoading();
            this.generalService.showFeedback(`${this.uploadIndex} image files successfully imported`, 'successMessage');
            this.uploading = false;
            this.imageFileModel = '';
            this.uploadIndex = 0;
            this.files = null;
            this.matDialog.close();
            return;
          }

          // More files remaining.
          this.uploadCurrentImageFile();

        }, 100);
      },
      error: (error: any) => {

        this.uploading = false;
        this.imageFileModel = '';
        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
