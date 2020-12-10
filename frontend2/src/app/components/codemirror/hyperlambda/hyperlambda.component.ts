
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import {
  Component,
  Input,
  OnInit,
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
}

/**
 * CodeMirror Hyperlambda component for making it easy
 */
@Component({
  selector: 'app-hyperlambda',
  templateUrl: './hyperlambda.component.html',
  styleUrls: ['./hyperlambda.component.scss']
})
export class HyperlambdaComponent extends BaseComponent implements OnInit {

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
}
