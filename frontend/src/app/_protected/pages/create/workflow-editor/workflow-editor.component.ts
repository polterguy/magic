
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { FileService } from 'src/app/_general/services/file.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BrowserJsPlumbInstance, newInstance } from "@jsplumb/browser-ui";

/**
 * Primary Workflow component, allowing users to create and manage workflows.
 */
@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss']
})
export class WorkflowEditorComponent implements OnInit {

  workflows: string[] = [];
  selectedWorkflow: any = null;
  @ViewChild('surface', { static: false }) surface: ElementRef;
  jsPlumbInstance: BrowserJsPlumbInstance;

  constructor(
    private fileService: FileService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.fileService.listFilesRecursively('/etc/workflows/workflows/', false).subscribe({

      next: (files: string[]) => {

        this.generalService.hideLoading();
        this.workflows = files
          .filter(x => x.endsWith('.hl'))
          .map(x => x.substring('/etc/workflows/workflows/'.length))
          .map(x => x.substring(0, x.length - 3));
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
      }
    });
  }

  workflowChanged() {

    this.jsPlumbInstance = newInstance({
      container: this.surface.nativeElement
    });
  }

  addNewWorkflow() {
  }
}
