
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { MessageService } from 'src/app/services/message.service';

// CodeMirror options files.
import hyperlambda from '../../settings/hyperlambda.json';

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
   * Input model.
   */
  public input: string = '';

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    hyperlambda: hyperlambda,
  };

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Service used to publish messages to other components
   */
  constructor(protected messageService: MessageService) {
    super(messageService);
  }

  ngOnInit() {
  }
}
