
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

// Application specific imports
import { SqlService } from 'src/app/services/sql.service';
import { Databases } from 'src/app/models/databases.model';
import { GeneralService } from 'src/app/services/general.service';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * Formly C# extension field.
 */
@Component({
  selector: 'app-formly-csharp',
  template: `
<div class="mb-4">
  <ngx-codemirror
    #editor
    class="csharp-formly-editor"
    *ngIf="cmOptions"
    [options]="cmOptions"
    [(ngModel)]="model[field.key]">
  </ngx-codemirror>
</div>`,
  styleUrls: ['./formly-csharp.scss']
})
export class FormlyCSharpComponent extends FieldType<FieldTypeConfig> implements OnInit {

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
      this.cmOptions = this.codemirrorActionsService.getActions(null, 'cs');
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

  /*
   * Private helpers.
   */
}
