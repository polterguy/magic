
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from '../../models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';
import { Model } from '../codemirror/hyperlambda/hyperlambda.component';
import { LoadSnippetDialogComponent } from './load-snippet-dialog/load-snippet-dialog.component';
import { SaveSnippetDialogComponent } from './save-snippet-dialog/save-snippet-dialog.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json'
import hyperlambda_readonly from '../codemirror/options/hyperlambda_readonly.json';

/**
 * Component allowing user to evaluate Hyperlambda snippets.
 */
@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent extends BaseComponent implements OnInit {

  /**
   * Input Hyperlambda component model and options.
   */
  public input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Output Hyperlambda component model and options.
   */
  public output: Model = {
    hyperlambda: '',
    options: hyperlambda_readonly,
  };

  /**
   * Currently edited snippet.
   */
  public filename: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Material dialog used for opening up Load snippets modal dialog
   * @param evaluatorService Used to execute Hyperlambda specified by user
   * @param messageService Service used to publish messages to other components
   */
  constructor(
    private dialog: MatDialog,
    private evaluatorService: EvaluatorService,
    protected messageService: MessageService) {
    super(messageService);
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Associating ALT+M with fullscreen toggling of the editor instance.
    this.input.options.extraKeys['Alt-M'] = (cm: any) => {
      cm.setOption('fullScreen', !cm.getOption('fullScreen'));
    };

    // Associating ALT+L with load snippet button.
    this.input.options.extraKeys['Alt-L'] = (cm: any) => {
      (document.getElementById('loadButton') as HTMLElement).click();
    };

    // Associating ALT+L with load snippet button.
    this.input.options.extraKeys['Alt-S'] = (cm: any) => {
      (document.getElementById('saveButton') as HTMLElement).click();
    };

    // Making sure we attach the F5 button to execute input Hyperlambda.
    this.input.options.extraKeys.F5 = () => {
      (document.getElementById('executeButton') as HTMLElement).click();
    };
  }

  /**
   * Shows load snippet dialog.
   */
  public load() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {

        // User gave us a filename, hence we load file from backend snippet collection.
        this.evaluatorService.loadSnippet(filename).subscribe((content: string) => {
          this.input.hyperlambda = content;
          this.filename = filename;
        }, (error: any) => this.showError(error));
      }
    });
  }

  /**
   * Shows the save snippet dialog.
   */
  public save() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(SaveSnippetDialogComponent, {
      width: '550px',
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {

        // User gave us a filename, hence saving file to backend snippet collection.
        this.evaluatorService.saveSnippet(filename, this.input.hyperlambda).subscribe((res: any) => {
          this.showInfo('Snippet successfully saved');
        }, (error: any) => this.showError(error));
      }
    });
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  public execute() {

    // Invoking backend service responsible for executing Hyperlambda.
    this.evaluatorService.execute(this.input.hyperlambda).subscribe((res: Response) => {

      // Success, updating result editor.
      this.output.hyperlambda = res.result;
      this.showInfoShort('Hyperlambda was successfully executed');

    }, (error: any) => this.showError(error));
  }
}
