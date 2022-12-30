
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { Observable } from 'rxjs';
import { AssumptionsComponent } from 'src/app/_general/components/assumptions/assumptions.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { FileService } from '../../../create/hyper-ide/services/file.service';

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

  public selectedItem: any;

  constructor(
    private clipboard: Clipboard,
    private dialog: MatDialog,
    private generalService: GeneralService,
    private fileService: FileService,
    private backendService: BackendService) { }

  public panelExpanded(el: any) {
    el.expanded = true;
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
        this.fileService.deleteFile(el.path.substring(5) + '.' + el.verb + '.hl').subscribe({
          next: () => {
            this.generalService.showFeedback('Endpoint successfully deleted');
            this.reload.emit({});
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    })
  }

  getPath(path: string) {
    return path.split('?')[0];
  }

  public requestEditor(item: any) {
    item.path = item.path.split('?')[0];
    this.selectedItem = item;
    this.changeEditor.emit(item);
  }

  public copyUrl(url: string) {
    this.clipboard.copy(this.backendService.active.url + '/' + url);
    this.generalService.showFeedback('URL is copied to your clipboard');
  }

  /**
   * For tracking the virtual scrolling on filterList
   * @param item
   * @returns item
   */
  public trackFilterList(item: any) {
    return item;
  }
}
