
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FeedbackService } from '../../../services/feedback.service';
import { FileService } from 'src/app/components/files/services/file.service';
import { EvaluatorService } from 'src/app/components/evaluator/services/evaluator.service';

// CodeMirror options according to file extensions.
import fileTypes from './file-types.json';
import { MessageService } from 'src/app/services/message.service';

/**
 * Component for editing a file.
 */
@Component({
  selector: 'app-file-editor',
  templateUrl: './file-editor.component.html',
  styleUrls: ['./file-editor.component.scss']
})
export class FileEditorComponent implements OnInit {

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  /**
   * CodeMirror options for file type.
   */
  public options: any = null;

  /**
   * Filename of file we're currently editing.
   */
  @Input() public file: string;

  /**
   * Content of file, if we're able to display it using a known editor.
   */
  public content: string = null;

  /**
   * Creates an instance of your component.
   * 
   * @param evaluatorService Used to load Hyperlambda vocabulary from backend
   * @param feedbackService Needed to supply feedback to user
   * @param messageService Needed to signal changes to the parent folder
   * @param fileService File service needed to retrieve file's content from backend
   */
  public constructor(
    private evaluatorService: EvaluatorService,
    private feedbackService: FeedbackService,
    protected messageService: MessageService,
    private fileService: FileService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Figuring out if this is a file type we can display contents of.
    const extension = this.file.substr(this.file.lastIndexOf('.') + 1).toLowerCase();
    const options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
    if (options.length > 0) {

      // We have a registered CodeMirror editor for this file extension.
      this.options = options[0].options;

      // Associating ALT+M with fullscreen toggling of the editor instance.
      this.options.extraKeys['Alt-M'] = (cm: any) => {
        cm.setOption('fullScreen', !cm.getOption('fullScreen'));
      };

      // Checking if this is a Hyperlambda file, at which point we load vocabulary before we load file.
      if (extension === 'hl') {

        // Loading vocabulary before we load file.
        this.evaluatorService.vocabulary().subscribe((vocabulary: string[]) => {

          // Assigning vocabulary to window object, for then to load Hyperlambda file.
          window['_vocabulary'] = vocabulary;
          this.loadFile();

        }, (error: any) => this.feedbackService.showError(error));

      } else {

        // Loading file by invoking backend.
        this.loadFile();
      }
    }
  }

  /**
   * Returns true if file is a module that can be unzipped and installed on the system.
   */
  public isZipFile() {
    return this.file.toLocaleLowerCase().endsWith('.zip');
  }

  /**
   * Returns true if file is a Hyperlambda file, at which point
   * we allow for user to execute it.
   */
  public isHyperlambdaFile() {

    // Simply returning true if file ends with Hyperlambda extension.
    return this.file.endsWith('.hl');
  }

  /**
   * Invoked when user wants to execute the current Hyperlambda file's content.
   */
  public execute() {

    // Notice! Executing *content* of file editor, and not file itself!
    this.evaluatorService.execute(this.content).subscribe((result: Response) => {

      // Providing feedback to user.
      this.feedbackService.showInfoShort('File successfully executed');

      // Simply logging result of invocation to console.
      console.log(result.result);

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to save file.
   */
  public save() {

    // Saving file by invoking backend.
    this.fileService.saveFile(this.file, this.content).subscribe(() => {

      // Giving user some feedback.
      this.feedbackService.showInfoShort('File was saved');
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Unzips the current file in the current folder.
   */
  public unzip() {

    // Invoking backend to unzip file.
    this.fileService.unzipFile(this.file).subscribe(() => {

      // Giving user some feedback.
      this.feedbackService.showInfoShort('File was successfully extracted');

      // Signalking changes in the current folder to subscribers.
      this.messageService.sendMessage({
        name: 'files.folder.changed'
      });
    });
  }

  /*
   * Private helper methods.
   */

  private loadFile() {

    // Invoking backend to load file.
    this.fileService.loadFile(this.file).subscribe((content: string) => {

      // Assigning content to field, which will show CodeMirror instance for file type.
      this.content = content;
    }, (error: any) => this.feedbackService.showError(error));
  }
}
