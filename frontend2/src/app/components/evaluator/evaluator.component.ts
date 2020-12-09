
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from '../../models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { EvaluatorService } from 'src/app/services/evaluator.service';
import { Model } from '../codemirror/hyperlambda/hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json'
import hyperlambda_readonly from '../codemirror/options/hyperlambda_readonly.json';

/**
 * Component allowing user to evaluate Hyperlambda snippets.
 */
@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent extends BaseComponent implements OnInit {

  /**
   * Input Hyperlambda component model and options.
   */
  public input: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  /**
   * Output Hyperlambda component model and options.
   */
  public output: Model = {
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
   * OnInit implementation.
   */
  ngOnInit() {

    // Making sure we attach the F5 button to execute input Hyperlambda.
    this.input.options.extraKeys.F5 = () => {
      const element = document.getElementById('executeButton') as HTMLElement;
      element.click();
    };
    this.input.options.extraKeys['Alt-M'] = (cm: any) => {
      cm.setOption('fullScreen', !cm.getOption('fullScreen'));
    };
  }

  /**
   * Executes the Hyperlambda from the input CodeMirror component.
   */
  public execute() {

    // Invoking backend service responsible for executing Hyperlambda.
    this.evaluatorService.execute(this.input.hyperlambda).subscribe((res: Response) => {

      // Success, updating result editor.
      this.output.hyperlambda = res.result;
      this.showInfoShort('Hyperlambda was successfully executed');

    }, (error: any) => this.showError(error));
  }
}
