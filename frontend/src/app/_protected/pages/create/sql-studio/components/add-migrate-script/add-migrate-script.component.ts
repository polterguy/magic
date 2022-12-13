
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodemirrorActionsService } from '../../../hyper-ide/_services/codemirror-actions.service';

interface Sql {
  sql: string,
}

@Component({
  selector: 'app-add-migrate-script',
  templateUrl: './add-migrate-script.component.html',
  styleUrls: ['./add-migrate-script.component.scss']
})
export class AddMigrateScriptComponent implements OnInit {

  public codemirrorReady: boolean = false;

  public options: any = null;

  constructor(
    private dialogRef: MatDialogRef<AddMigrateScriptComponent>,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(MAT_DIALOG_DATA) public data: Sql,) { }

  ngOnInit() {
    this.getCodeMirrorOptions();
    setTimeout(() => {
      this.codemirrorInit();
    }, 100);
  }

  private getCodeMirrorOptions() {
    this.codemirrorActionsService.getActions(null, 'sql').then((options: any) => {
      this.options = options;
      if (options) {
        setTimeout(() => {
          this.codemirrorInit();
        }, 100);
      }
    });
  }

  create() {
    this.dialogRef.close({
      apply: true,
    });
  }

  private codemirrorInit() {
    this.codemirrorReady = true;
    setTimeout(() => {
      const domNode = (<any>document.querySelector('.CodeMirror'));
      const editor = domNode.CodeMirror;
      editor.doc.markClean();
      editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
    }, 100);
  }
}
