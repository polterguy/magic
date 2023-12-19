
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Modal dialog allowing you to parametrise and execute a macro.
 */
@Component({
  selector: 'app-parametrise-action-dialog',
  templateUrl: './parametrise-action-dialog.component.html',
  styleUrls: ['./parametrise-action-dialog.component.scss']
})
export class ParametriseActionDialog implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {

    console.log(this.data);
  }
}
