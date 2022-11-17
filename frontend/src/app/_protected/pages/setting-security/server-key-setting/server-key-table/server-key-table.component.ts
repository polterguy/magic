import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { ServerKeyDetailsComponent } from '../components/server-key-details/server-key-details.component';
import { PublicKey } from '../_models/public-key.model';
import { CryptoService } from '../_services/crypto.service';

@Component({
  selector: 'app-server-key-table',
  templateUrl: './server-key-table.component.html',
  styleUrls: ['./server-key-table.component.scss']
})
export class ServerKeyTableComponent implements OnInit {

  @Output() invokeViewReceipts: EventEmitter<any> = new EventEmitter<any>();

  displayedColumns: string[] = ['name', 'domain', 'email', 'created', 'enabled', 'actions'];

  public dataSource: any = [];

  pageIndex: number = 0;
  pageSize: number = 5;
  totalItems: number = 0;

  public isLoading: boolean = true;

  private savePermission: boolean = undefined;

  constructor(
    private dialog: MatDialog,
    private cryptoService: CryptoService,
    private generalService: GeneralService,
    private backendService: BackendService) { }

  ngOnInit(): void {
    this.getPermissions();
    this.getKeys();
    this.getCount();
  }

  private getPermissions() {
    (async () => {
      while (!this.backendService.active.access || !Object.keys(this.backendService.active.access.crypto).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.backendService.active.access && Object.keys(this.backendService.active.access.crypto).length > 0) {
        this.savePermission = this.backendService.active?.access.crypto.save_public_key;
      }
    })();
  }

  /*
   * Returns public keys from backend.
   */
  public getKeys() {
    this.isLoading = true;
    this.cryptoService.publicKeys({
      filter: '',
      offset: this.pageIndex * this.pageSize,
      limit: this.pageSize
    }).subscribe({
      next: (keys: PublicKey[]) => {
        this.dataSource = keys || [];
        this.isLoading = false;
      },
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  public getCount() {
    const filter: string = '';
    this.cryptoService.countPublicKeys({ filter: filter }).subscribe({
      next: (res) => {
        this.totalItems = res.count;
      },

      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  /**
   * Deletes a public cryptography key from your backend.
   *
   * @param key Public key to delete
   */
  public deleteKey(key: PublicKey) {
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete ${key.subject}`,
        description_extra: `You are deleting the public key belonging to <br/><span class="fw-bold">${key.subject} - ${key.email}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {
        this.cryptoService.deletePublicKey(key.id).subscribe({
          next: () => {
            this.generalService.showFeedback('Public key successfully deleted', 'successMessage');
            this.getKeys();
            this.getCount();
          },
          error:(error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
      }
    })
  }

  /**
   * Changes the enabled state of the specified key.
   *
   * @param key What key to modify
   */
  public enabledChanged(event: any, key: PublicKey) {
    this.cryptoService.setEnabled(key.id, event.checked).subscribe({
      next: () => {
        this.generalService.showFeedback(`Key was successfully ${event.checked ? 'enabled' : 'disabled'}`, 'successMessage')
        this.getKeys();
      },
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  public viewDetails(key: PublicKey) {
    const keyData: any = {...key};
    keyData.original_content = key.content;
    this.dialog.open(ServerKeyDetailsComponent, {
      width: '80vw',
      panelClass: ['light'],
      data: {
        key: keyData,
        savePermission: this.savePermission
      }
    }).afterClosed().subscribe((res: any) => {
      if (res === true) {
        this.getKeys();
      }
    })
  }

  public viewReceipts(key: PublicKey) {
    const event: any = {
      key: key,
      index: 1
    }
    this.invokeViewReceipts.emit(event);
  }

  /**
   * Invoked when paginator wants to page data table.
   *
   * @param e Page event argument
   */
  public changePage(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getKeys();
  }
}
