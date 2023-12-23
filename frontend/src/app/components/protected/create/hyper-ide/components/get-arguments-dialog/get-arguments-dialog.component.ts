
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
  selector: 'app-get-arguments-dialog',
  templateUrl: './get-arguments-dialog.component.html',
  styleUrls: ['./get-arguments-dialog.component.scss']
})
export class GetArgumentsDialog implements OnInit {

  /**
   * Creates an instance of your component.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    console.log(this.data);
  }

  apply() {}
}
