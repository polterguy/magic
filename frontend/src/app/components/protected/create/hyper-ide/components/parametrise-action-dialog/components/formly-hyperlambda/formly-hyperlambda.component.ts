
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

// Application specific imports
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * Formly C# extension field.
 */
@Component({
  selector: 'app-formly-hyperlambda',
  template: `
<div class="mb-4">
  <ngx-codemirror
    #editor
    class="hyperlambda-formly-editor"
    *ngIf="cmOptions"
    [options]="cmOptions"
    [(ngModel)]="model[field.key]">
  </ngx-codemirror>
</div>`,
  styleUrls: ['./formly-hyperlambda.scss']
})
export class FormlyHyperlambdaComponent extends FieldType<FieldTypeConfig> implements OnInit {

  @ViewChild('editor') private editor: CodemirrorComponent;
  cmOptions: any = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private codemirrorActionsService: CodemirrorActionsService) {

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
      this.cmOptions = this.codemirrorActionsService.getActions(null, 'hl');
      this.cmOptions.autofocus = false;
      this.cdr.detectChanges();

      // Waiting until CodeMirror is displayed, and cleaning history.
      setTimeout(() => {

        // Cleaning out history and marking editor as clean.
        this.editor.codeMirror.getDoc().markClean();
        this.editor.codeMirror.getDoc().clearHistory();
      }, 1);
    }, 250);
  }
}
