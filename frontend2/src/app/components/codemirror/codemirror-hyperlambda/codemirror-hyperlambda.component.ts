
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../../base.component';
import { MessageService } from 'src/app/services/message.service';
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
export class HyperlambdaComponent extends BaseComponent implements OnInit, AfterViewInit {

  // Actual CodeMirror instance, needed to retrieve selected text.
  @ViewChild('codeeditor') private _editor: { codeMirror: any; };

  /**
   * Model for component containing Hyperlambda that is displayed.
   */
  @Input() public model: Model;

  /**
   * Creates an instance of your component.
   * 
   * @param evaluatorService Evaluator service used to retrieve auto complete keywords (vocabulary)
   */
  constructor(
    private evaluatorService: EvaluatorService,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving server's vocabulary, but only if editor is not read only.
    if (this.model.options.readonly !== false) {
      this.evaluatorService.vocabulary().subscribe((vocabulary: string[]) => {
        window['_vocabulary'] = vocabulary;
      }, error => this.showError(error));
    }
  }

  /**
   * Implementation of AfterViewInit
   */
  public ngAfterViewInit() {
    this.model.editor = this._editor.codeMirror;
  }
}
