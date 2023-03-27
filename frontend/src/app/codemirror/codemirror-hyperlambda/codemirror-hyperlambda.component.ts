
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import {
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

// Application specific imports.
import { GeneralService } from 'src/app/_general/services/general.service';
import { VocabularyService } from 'src/app/_general/services/vocabulary.service';

export class Model {
  hyperlambda: string;
  options: any;
  editor?: any;
}

/**
 * CodeMirror Hyperlambda component for making it easy to edit Hyperlambda files with
 * syntax highlightning and auto complete.
 */
@Component({
  selector: 'app-codemirror-hyperlambda',
  templateUrl: './codemirror-hyperlambda.component.html'
})
export class HyperlambdaComponent implements OnInit {

  @ViewChild('codeeditor') private _editor: { codeMirror: any; };
  @Input() public model: Model;

  vocabularyLoaded = false;

  constructor(
    private vocabularyService: VocabularyService,
    private generalService: GeneralService) { }

  ngOnInit() {

    if (window['_vocabulary']) {
      this.init();

    } else {

      this.vocabularyService.vocabulary().subscribe({
        next: (vocabulary: string[]) => {

          window['_vocabulary'] = vocabulary;
          this.init();
        },
        error: (error: any) => this.generalService.showFeedback(error.error.message ?? error, 'errorMessage')
      })
    }
  }

  /*
   * Private helper methods.
   */

  private init() {

    this.vocabularyLoaded = true;
    setTimeout(() => {
      this.model.editor = this._editor.codeMirror;
      this.model.editor.doc.markClean();
      this.model.editor.doc.clearHistory();
    }, 250);
  }
}
