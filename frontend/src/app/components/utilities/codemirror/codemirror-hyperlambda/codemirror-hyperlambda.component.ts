
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import {
  AfterViewInit,
  Component,
  Input,
  ViewChild,
} from '@angular/core';

// Application specific imports.
import { FeedbackService } from '../../../../services--/feedback.service';
import { VocabularyService } from 'src/app/components/tools/services/vocabulary.service';

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
  templateUrl: './codemirror-hyperlambda.component.html'
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
   * @param vocabularyService Evaluator service used to retrieve auto complete keywords (vocabulary)
   */
  constructor(
    private vocabularyService: VocabularyService,
    private feedbackService: FeedbackService) {
  }

  /**
   * Implementation of AfterViewInit
   */
  public ngAfterViewInit() {

    // Retrieving server's vocabulary.
    if (window['_vocabulary']) {

      // Vocabulary already loaded, initializing editor immediately.
      this.init();

    } else {

      // Loading vocabulary from server before initializing editor.
      this.vocabularyService.vocabulary().subscribe((vocabulary: string[]) => {

        // Publishing vocabulary such that autocomplete component can reach it.
        window['_vocabulary'] = vocabulary;
        this.init();

      }, error => this.feedbackService.showError(error));
    }
  }

  /*
   * Private helper methods.
   */

  /*
   * Initializes editor.
   */
  private init() {

    /*
     * This looks a bit stupid, but is necessary to allow for editor to be rendered
     * before we assign the editor instance to its field.
     */
    setTimeout(() => {
      this.vocabularyLoaded = true;
      setTimeout(() => {
        this.model.editor = this._editor?.codeMirror;

        // Associating ALT+M with fullscreen toggling of the editor instance.
        if (this.model.options.extraKeys) {
          this.model.options.extraKeys['Alt-M'] = (cm: any) => {
            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
            // to hide/show sidenav
            let sidenav = document.querySelector('.mat-sidenav');
            sidenav.classList.contains('d-none') ? sidenav.classList.remove('d-none') :
            sidenav.classList.add('d-none');
          };
        }
      }, 100);
    }, 1);
  }
}
