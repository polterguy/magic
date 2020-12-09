
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from '../../models/response.model';
import { Model } from '../codemirror/hyperlambda.component';
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
   * Input Hyperlambda component model and options.
   */
  public inputModel: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Output Hyperlambda component model and options.
   */
  public outputModel: Model = {
    hyperlambda: '',
    options: hyperlambda_readonly,
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

    // Invoking backend service responsible for executing Hyperlambda.
    this.evaluatorService.execute(this.inputModel.hyperlambda).subscribe((res: Response) => {

      // Success, updating result editor.
      this.outputModel.hyperlambda = res.result;
      this.showInfo('Hyperlambda was successfully executed');

    }, (error: any) => this.showError(error));
  }
}
