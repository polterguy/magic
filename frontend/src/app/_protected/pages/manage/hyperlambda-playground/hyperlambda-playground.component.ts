
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { LoadSnippetDialogComponent } from 'src/app/_general/components/load-snippet-dialog/load-snippet-dialog.component';
import { SnippetNameDialogComponent } from 'src/app/_general/components/snippet-name-dialog/snippet-name-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { EvaluatorService } from '../../../../_general/services/evaluator.service';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';

import { Subscription } from 'rxjs';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { CodemirrorActionsService } from '../../../../_general/services/codemirror-actions.service';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from 'src/app/codemirror/options/hyperlambda.json';
import hyperlambda_readonly from 'src/app/codemirror/options/hyperlambda_readonly.json';
import { FileService } from '../../../../_general/services/file.service';

/**
 * Hyperlambda Playground component, allowing user to execute arbitrary Hyperlambda, and/or
 * save/load snippets for later.
 */
@Component({
  selector: 'app-hyperlambda-playground',
  templateUrl: './hyperlambda-playground.component.html',
  styleUrls: ['./hyperlambda-playground.component.scss']
})
export class HyperlambdaPlaygroundComponent implements OnInit, OnDestroy {

  private codemirrorActionSubscription!: Subscription;

  input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  output: Model = {
    hyperlambda: '',
    options: hyperlambda_readonly,
  };

  filename: string = null;

  constructor(
    private evaluatorService: EvaluatorService,
    private generalService: GeneralService,
    private dialog: MatDialog,
    private fileService: FileService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {
    this.getCodeMirrorOptions();
    this.watchForActions();
  }

  insertFromOpenAI(snippet: string) {
    this.input.hyperlambda = snippet;
  }

  load() {
    this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    }).afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.loadSnippet(filename).subscribe({
          next: (content: string) => {
            this.input.hyperlambda = content;
            this.filename = filename;
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  save() {
    if (!this.input?.hyperlambda || this.input?.hyperlambda === '') {
      this.generalService.showFeedback('Code editor is empty.', 'errorMessage')
      return;
    }
    this.dialog.open(SnippetNameDialogComponent, {
      width: '550px',
      data: this.filename || '',
    }).afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.saveSnippet(filename, this.input.hyperlambda).subscribe({
          next: () => {
            this.generalService.showFeedback('Snippet successfully saved', 'successMessage');
            this.filename = filename
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  execute() {
    if (!this.input.hyperlambda || this.input.hyperlambda === '') {
      this.generalService.showFeedback('There is nothing to execute', 'errorMessage');
      return;
    }
    const domNode = (<any>document.querySelector('.CodeMirror'));
    const editor = domNode.CodeMirror;
    if (editor.getDoc().getValue() === '') {
      return;
    }
    this.generalService.showLoading();
    const selectedText = this.input.editor.getSelection();
    this.evaluatorService.execute(selectedText == '' ? this.input.hyperlambda : selectedText).subscribe({
      next: (res: MagicResponse) => {
        this.output.hyperlambda = res.result;
        this.generalService.showFeedback('Hyperlambda was successfully executed', 'successMessage');
        this.generalService.hideLoading();
      },
      error: (error: any) => {
        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 5000)
      }
    });
  }

  viewShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '900px',
      data: {
        type: ['save', 'execute']
      }
    })
  }

  ngOnDestroy(): void {
    if (this.codemirrorActionSubscription) {
      this.codemirrorActionSubscription.unsubscribe();
    }
  }

  /*
   * Private helper methods.
   */

  private getCodeMirrorOptions() {
    const options = this.codemirrorActionsService.getActions(null, 'hl');
    this.input.options = options;
  }

  private watchForActions() {
    this.codemirrorActionSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {
      switch (action) {
        case 'save':
          this.save();
          break;

        case 'insertSnippet':
          this.load();
          break;

        case 'execute':
          this.execute();
          break;

        default:
          break;
      }
    });
  }
}
