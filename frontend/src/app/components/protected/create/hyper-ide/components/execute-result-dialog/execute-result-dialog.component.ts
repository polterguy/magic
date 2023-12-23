
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * Modal dialog allowing you to view the result of executing some piece of Hyperlambda.
 */
@Component({
  selector: 'app-execute-result-dialog',
  templateUrl: './execute-result-dialog.component.html',
  styleUrls: ['./execute-result-dialog.component.scss']
})
export class ExecuteResultDialog implements OnInit {

  hlReady: boolean = false;
  hlModel: HlModel;

  /**
   * Creates an instance of your component.
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {

    const res = this.codemirrorActionsService.getActions(null, 'hl');
    res.readOnly = true;
    this.hlModel = {
      hyperlambda: this.data.hyperlambda,
      options: res,
    }
    setTimeout(() => {
      this.hlReady = true;
    }, 500);
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
