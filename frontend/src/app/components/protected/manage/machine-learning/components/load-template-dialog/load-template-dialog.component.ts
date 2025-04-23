
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { OpenAIService } from 'src/app/services/openai.service';

/**
 * Modal helper dialog to load template snippets from the backend.
 */
@Component({
  selector: 'app-load-template-dialog',
  templateUrl: './load-template-dialog.component.html'
})
export class LoadTemplateDialogComponent implements OnInit {

  templates: any[] = [];
  filter: string = null;

  constructor(
    private openAiService: OpenAIService,
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<LoadTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {

    this.getFunctions();
  }

  filterList(event: { searchKey: string }) {

    this.filter = event.searchKey;
  }

  select(el: any) {

    this.dialogRef.close(el);
  }

  getTemplates() {

    if (!this.templates || this.templates.length === 0) {
      return [];
    }

    if (!this.filter || this.filter === '') {
      return this.templates;
    }
    return this.templates.filter(x => x.prompt.toLowerCase().includes(this.filter.toLowerCase()));
  }

  /*
   * Private helper methods.
   */

  private getFunctions() {

    // Invoking backend to get functions.
    this.generalService.showLoading();
    this.openAiService.getAvailableTemplateSnippets().subscribe({

      next: (result: any[]) => {

        this.templates = result ?? [];
        this.generalService.hideLoading();
      },

      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Could not retrieve template snippets from backend', 'errorMessage');
      }
    });
  }
}
