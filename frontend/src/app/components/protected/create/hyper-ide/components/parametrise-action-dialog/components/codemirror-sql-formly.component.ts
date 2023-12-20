
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * CodeMirror Formly extension field.
 */
@Component({
  selector: 'app-codemirror-formly',
  template: `<ngx-codemirror #editor *ngIf="cmOptions" [options]="cmOptions" [(ngModel)]="model[field.key]"></ngx-codemirror>`,
})
export class CodemirrorSqlFormlyComponent extends FieldType<FieldTypeConfig> implements OnInit {

  @ViewChild('editor') private editor: CodemirrorComponent;
  cmOptions: any = null;
  ready: boolean = false;

  constructor(
    private codemirrorActionsService: CodemirrorActionsService,
    private cdn: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {

    /*
     * CodeMirror doesn't support being initialised as component is not displayed,
     * and Angular applies animations to fade in using opacity ... :/
     * 
     * Hence the timeout hack here ...
     */
    setTimeout(() => {

      // This will display CodeMirror due to its *ngIf part.
      this.cmOptions = this.codemirrorActionsService.getActions(null, 'sql');
      this.cdn.detectChanges();

      // Waiting until CodeMirror is displayed, and cleaning history.
      setTimeout(() => {
        this.editor.codeMirror.getDoc().markClean();
        this.editor.codeMirror.getDoc().clearHistory();
      }, 1);
    }, 250);
  }
}
