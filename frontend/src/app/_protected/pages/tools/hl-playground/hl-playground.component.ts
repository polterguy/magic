import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { LoadSnippetDialogComponent } from 'src/app/_general/components/load-snippet-dialog/load-snippet-dialog.component';
import { SnippetNameDialogComponent } from 'src/app/_general/components/snippet-name-dialog/snippet-name-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { EvaluatorService } from './_services/evaluator.service';
import { Response } from 'src/app/_protected/models/common/response.model';

import { Subscription } from 'rxjs';
import { ShortkeysComponent } from 'src/app/_general/components/shortkeys/shortkeys.component';
import { CodemirrorActionsService } from '../../tools/hyper-ide/_services/codemirror-actions.service';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from 'src/app/codemirror/options/hyperlambda.json';
import hyperlambda_readonly from 'src/app/codemirror/options/hyperlambda_readonly.json';
import { FileService } from '../../tools/hyper-ide/_services/file.service';

@Component({
  selector: 'app-hl-playground',
  templateUrl: './hl-playground.component.html',
  styleUrls: ['./hl-playground.component.scss']
})
export class HlPlaygroundComponent implements OnInit, OnDestroy {

  /**
   * Input Hyperlambda component model and options.
   */
   input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Output Hyperlambda component model and options.
   */
  output: Model = {
    hyperlambda: '',
    options: hyperlambda_readonly,
  };

  /**
   * Currently edited snippet.
   */
  filename: string = null;

  private codemirrorActionSubscription!: Subscription;

  /**
   * Creates an instance of your component.
   *
   * @param evaluatorService Used to execute Hyperlambda specified by user
   * @param generalService Needed to display feedback to user
   * @param dialog Needed to be able to create model dialogs
   */
  constructor(
    private evaluatorService: EvaluatorService,
    private generalService: GeneralService,
    private dialog: MatDialog,
    private fileService: FileService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.getCodeMirrorOptions();
    this.watchForActions();
  }
  private async getCodeMirrorOptions() {
    this.codemirrorActionsService.getActions(null, 'hl').then((res: any) => {
      this.input.options = res;
     });
  }

  /**
   * Shows load snippet dialog.
   */
  load() {
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.loadSnippet(filename).subscribe({
          next: (content: string) => {
            this.input.hyperlambda = content;
            this.filename = filename;
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
      }
    });
  }

  /**
   * Shows the save snippet dialog.
   */
  save() {
    const dialogRef = this.dialog.open(SnippetNameDialogComponent, {
      width: '550px',
      data: this.filename || '',
    });
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.saveSnippet(filename, this.input.hyperlambda).subscribe({
          next: () => this.generalService.showFeedback('Snippet successfully saved'),
          error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
      }
    });
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  execute() {
    const domNode = (<any>document.querySelector('.CodeMirror'));
    const editor = domNode.CodeMirror;
    if (editor.getDoc().getValue() === '') {
      return;
    }
    const selectedText = this.input.editor.getSelection();
    this.evaluatorService.execute(selectedText == '' ? this.input.hyperlambda : selectedText).subscribe({
      next: (res: Response) => {
        this.output.hyperlambda = res.result;
        this.generalService.showFeedback('Hyperlambda was successfully executed', 'successMessage');
      },
      error: (error: any) =>  this.generalService.showFeedback(error?.error?.message??error, 'errorMessage', 'Ok', 5000)});
  }

  public clear() {
    const domNode = (<any>document.querySelector('.CodeMirror'));
    const editor = domNode.CodeMirror;

    if (editor.getDoc().getValue() === '') {
      return;
    }
    editor.getDoc().setValue('');
  }

  public saveAsFile() {
    if (this.output.editor.getValue() === '') {
      return;
    }

    this.fileService.saveFile(`/hyperlambda-test--${Date.now()}.hl`, this.output.editor.getValue()).subscribe({
      next: () => {
        this.generalService.showFeedback('File successfully saved', 'successMessage');
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  public viewShortkeys() {
    this.dialog.open(ShortkeysComponent, {
      width: '500pc'
    })
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
    })
  }

  ngOnDestroy(): void {
    if (this.codemirrorActionSubscription) {
      this.codemirrorActionSubscription.unsubscribe();
    }
  }
}
