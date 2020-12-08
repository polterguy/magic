
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from '../../models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';

// CodeMirror options.
import hyperlambda from '../../codemirror/hyperlambda.json';
import hyperlambda_readonly from '../../codemirror/hyperlambda_readonly.json';

/**
 * Component allowing user to evaluate Hyperlambda snippets.
 */
@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent extends BaseComponent {

  /**
   * Input Hyperlambda model.
   */
  public input: string = '';

  /**
   * Hyperlambda resulting from evaluation.
   */
  public result: string = '';

  /**
   * CodeMirror options object for input Hyperlambda.
   */
  public cmInputOptions = {
    hyperlambda: hyperlambda,
  };

  /**
   * CodeMirror options object for resulting Hyperlambda.
   */
  public cmOutputOptions = {
    hyperlambda: hyperlambda_readonly,
  };

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Service used to publish messages to other components
   */
  constructor(
    protected messageService: MessageService,
    private evaluatorService: EvaluatorService) {
    super(messageService);
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  public execute() {
    this.evaluatorService.execute(this.input).subscribe((res: Response) => {
      this.result = res.result;
      this.showInfo('Hyperlambda was successfully executed');
    });
  }
}
