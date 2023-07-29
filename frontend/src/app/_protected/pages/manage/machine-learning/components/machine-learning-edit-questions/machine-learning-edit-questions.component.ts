
/*
 * Copyright (c) Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';

/**
 * Component allowing the user to edit questions for a questionnaire.
 */
@Component({
  selector: 'app-machine-learning-edit-questions',
  templateUrl: './machine-learning-edit-questions.component.html',
  styleUrls: ['./machine-learning-edit-questions.component.scss']
})
export class MachineLearningEditQuestionsComponent implements OnInit {

  ready: boolean = false;
  options: any;

  questions: string = '';

  constructor(private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    this.options = this.codemirrorActionsService.getActions(null, 'md');
    setTimeout(() => {

      this.ready = true;
    }, 250);
  }
}
