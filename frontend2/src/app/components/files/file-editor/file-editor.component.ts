
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { FileService } from 'src/app/services/file.service';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';

// CodeMirror options according to file extensions.
import fileTypes from './file-types.json'

/**
 * Component for editing a file.
 */
@Component({
  selector: 'app-file-editor',
  templateUrl: './file-editor.component.html',
  styleUrls: ['./file-editor.component.scss']
})
export class FileEditorComponent extends BaseComponent implements OnInit {

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
   * @param fileService File service needed to retrieve file's content from backend
   * @param evaluatorService Used to load Hyperlambda vocabulary from backend
   * @param messageService Needed to send and retrieve messages from other components
   */
  public constructor(
    private fileService: FileService,
    private evaluatorService: EvaluatorService,
    protected messageService: MessageService) {
    super(messageService);
  }

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

        }, (error: any) => this.showError(error));

      } else {

        // Loading file by invoking backend.
        this.loadFile();
      }
    }
  }

  /**
   * Invoked when user wants to save file.
   */
  public save() {

    // Saving file by invoking backend.
    this.fileService.saveFile(this.file, this.content).subscribe(() => {

      // Giving user some feedback.
      this.showInfoShort('File was saved');
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
    }, (error: any) => this.showError(error));
  }
}
