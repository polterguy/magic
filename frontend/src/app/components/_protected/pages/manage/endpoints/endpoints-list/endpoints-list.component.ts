
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/services/general.service';
import { BackendService } from 'src/app/services/backend.service';
import { Observable } from 'rxjs';
import { AssumptionsComponent } from 'src/app/_general/components/assumptions/assumptions.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { FileService } from '../../../../../../services/file.service';

/**
 * Helper component to display all endpoints in the system,
 * allowing user to invoke endpoints, and search for endpoints.
 */
@Component({
  selector: 'app-endpoints-list',
  templateUrl: './endpoints-list.component.html',
  styleUrls: ['./endpoints-list.component.scss']
})
export class EndpointsListComponent {

  @Input() endpoints: any = [];
  @Input() defaultListToShow: string = 'system';
  @Input() result: any;
  @Input() payload: any;
  @Input() isLoading: Observable<boolean>;
  @ViewChild('assumptions', { static: false }) assumptions: AssumptionsComponent;
  @Output() changeEditor = new EventEmitter<any>();
  @Output() reload = new EventEmitter<any>();

  selectedItem: any;

  constructor(
    private clipboard: Clipboard,
    private dialog: MatDialog,
    private generalService: GeneralService,
    private fileService: FileService,
    private backendService: BackendService) { }

  panelExpanded(el: any) {

    el.expanded = true;
  }

  isExpanded(el: any) {

    return el.expanded;
  }

  deleteEndpoint(el: any) {

    const confirm = el.path.substring(el.path.lastIndexOf('/') + 1);
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete endpoint ${confirm}`,
        description_extra: `This action cannot be undone and will be permanent.<br/><br/>Please type in <span class="fw-bold">${confirm}</span> below.`,
        action_btn: 'Delete endpoint',
        action_btn_color: 'warn',
        bold_description: true,
        extra: {
          details: el,
          action: 'confirmInput',
          fieldToBeTypedTitle: 'path',
          fieldToBeTypedValue: confirm,
          icon: 'delete'
        }
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        this.fileService.deleteFile(el.path.substring(5) + '.' + el.verb + '.hl').subscribe({
          next: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Endpoint successfully deleted');
            this.reload.emit({});
          },
          error: (error: any) => {

            this.generalService.hideLoading();
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
          }
        });
      }
    })
  }

  getPath(path: string) {

    return path.split('?')[0];
  }

  requestEditor(item: any) {

    item.path = item.path.split('?')[0];
    this.selectedItem = item;
    this.changeEditor.emit(item);
  }

  copyUrl(url: string) {

    this.clipboard.copy(this.backendService.active.url + '/' + url);
    this.generalService.showFeedback('URL is copied to your clipboard');
  }

  trackFilterList(item: any) {

    return item;
  }
}
