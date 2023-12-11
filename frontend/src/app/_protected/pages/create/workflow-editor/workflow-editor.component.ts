
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component } from '@angular/core';
import { ReplaySubject } from 'rxjs';

/**
 * Primary Workflow component, allowing users to create and manage workflows.
 */
@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss']
})
export class WorkflowEditorComponent {

  private _dbLoading: ReplaySubject<boolean> = new ReplaySubject();

  dbLoading = this._dbLoading.asObservable();
  workflows: any[] = [];
  selectedWorkflow: any = null;

  workflowChanged(el: any) {
    console.log(el);
  }

  addNewWorkflow() {
    
  }
}
