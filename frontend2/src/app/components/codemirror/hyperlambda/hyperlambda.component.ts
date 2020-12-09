
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
   * Server's Hyperlambda vocabulary
   */
  public vocabulary: string[] = [];

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

    // Retrieving server vocabulary.
    // TODO: Invoke only ONCE for all editors (store in localStorage).
    this.evaluatorService.vocabulary().subscribe((res: string[]) => {
      this.vocabulary = res;
    }, error => this.showError(error));
  }
}
