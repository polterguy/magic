
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import {
  AfterViewInit,
  Component,
  Input,
  ViewChild,
} from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../../services/feedback.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';

/**
 * Model class for CodeMirror instance's Hyperlambda.
 */
export class Model {

  /**
   * Two way databound model for editor.
   */
  hyperlambda: string;

  /**
   * Options for editor.
   */
  options: any;

  /**
   * Actual CodeMirror instance, useful for determining selected text, etc.
   */
  editor?: any;
}

/**
 * CodeMirror Hyperlambda component for making it easy
 */
@Component({
  selector: 'app-codemirror-hyperlambda',
  templateUrl: './codemirror-hyperlambda.component.html',
  styleUrls: ['./codemirror-hyperlambda.component.scss']
})
export class HyperlambdaComponent implements AfterViewInit {

  // Actual CodeMirror instance, needed to retrieve selected text.
  @ViewChild('codeeditor') private _editor: { codeMirror: any; };

  /**
   * Model for component containing Hyperlambda that is displayed.
   */
  @Input() public model: Model;
  
  /**
   * If true, vocabulary has been loaded from server.
   */
  public vocabularyLoaded = false;

  /**
   * Creates an instance of your component.
   * 
   * @param evaluatorService Evaluator service used to retrieve auto complete keywords (vocabulary)
   */
  constructor(
    private evaluatorService: EvaluatorService,
    private feedbackService: FeedbackService) {
  }

  /**
   * Implementation of AfterViewInit
   */
  public ngAfterViewInit() {

    // Retrieving server's vocabulary.
    if (window['_vocabulary']) {

      /*
       * Vocabulary has already been loaded previously.
       *
       * This looks a bit stupid, but is necessary to allow for editor to be rendered
       * before we assign the editor instance to its field.
       */
      setTimeout(() => {
        this.vocabularyLoaded = true;
        setTimeout(() => {
          this.model.editor = this._editor.codeMirror;
        }, 1);
      }, 1);

    } else {

      // Loading vocabulary from server.
      this.evaluatorService.vocabulary().subscribe((vocabulary: string[]) => {

        // Publishing vocabulary such that autocomplete component can reach it.
        window['_vocabulary'] = vocabulary;

        /*
         * This looks a bit stupid, but is necessary to allow for editor to be rendered
         * before we assign the editor instance to its field.
         */
        setTimeout(() => {
          this.vocabularyLoaded = true;
          setTimeout(() => {
            this.model.editor = this._editor.codeMirror;
          }, 1);
        }, 1);

      }, error => this.feedbackService.showError(error));
    }
  }
}
