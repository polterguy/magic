
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetupService } from 'src/app/services/setup-service';
import { TicketService } from 'src/app/services/ticket-service';
import { KeysService } from 'src/app/services/keys-service';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { ImportKeyDialogComponent } from './modals/import-key-dialog';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'crypto-home',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent implements OnInit {
  public isFetching = false;
  public keyExists = false;
  public fingerprint: string;
  public publicKey: string;
  public seed: string = '';
  public strength: number = null;
  public strengthOptions: number[] = [
    2048,
    4096,
    8192
  ];
  public displayedColumns: string[] = [
    'subject',
    'email',
    'domain',
    'delete',
  ];
  public keys: any = [];
  public filter = '';

  public displayedColumnsInvocations: string[] = [
    'crypto_key',
    'request_id',
    'created',
    'request',
  ];
  public invocations: any = [];
  public invocationsFilter: any = {
    limit: 10,
    offset: 0,
  };
  public invocationsCount: number;

  constructor(
    private ticketService: TicketService,
    private evaluatorService: EvaluatorService,
    private keysService: KeysService,
    private service: SetupService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.service.getPublicKey().subscribe((res: any) => {
      if (res.result !== 'FAILURE') {
        this.showKey(res);
      }
    }, (error: any) => {
      this.snackBar.open(error.error.msg);
    });
    this.getKeys();
    this.getInvocations();
  }

  generate() {
    this.isFetching = true;
    this.service.generateKeyPair(this.seed, this.strength).subscribe((res: any) => {
      this.isFetching = false;
      this.showKey(res);
      this.snackBar.open('Key successfully created', 'ok', {
        duration: 5000,
      });
      this.keysService.evictCache('magic.crypto.get-server-public-key').subscribe(res3 => {
        console.log(res3);
      });
    }, (error: any) => {
      this.isFetching = false;
      this.snackBar.open(error.error.message);
    });
  }

  showKey(key: any) {
    this.keyExists = true;
    this.fingerprint = key.fingerprint;
    this.publicKey = key['public-key'];
  }

  getQrCodeKeyFingerprintURL() {
    return this.ticketService.getBackendUrl() +
      'magic/modules/system/images/generate-qr?size=5&content=' +
      encodeURIComponent(this.ticketService.getBackendUrl() +
        'magic/modules/system/crypto/public-key-raw')
  }

  getKeys() {
    this.keysService.getKeys(this.filter).subscribe(res => {
      this.keys = res || [];
    });
  }

  importKey() {
    const dialogRef = this.dialog.open(ImportKeyDialogComponent, {
      width: '1000px',
      disableClose: true,
      data: {
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        if (res.domain.startsWith('http://')) {
          res.domain = res.domain.substring(7);
        } else if (res.domain.startsWith('https://')) {
          res.domain = res.domain.substring(8);
        }
        this.keysService.importKey(
          res.subject,
          res.domain,
          res.email,
          res.content,
          res.vocabulary,
          res.fingerprint)
          .subscribe(res => {
            this.getKeys();
          }, error => {
            this.snackBar.open(error.error.message, 'ok');
          });
      }
    });
  }

  editKey(key: any) {
    const dialogRef = this.dialog.open(ImportKeyDialogComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        id: key.id,
        imported: key.imported,
        subject: key.subject,
        domain: key.domain,
        email: key.email,
        content: key.content,
        vocabulary: key.vocabulary,
        fingerprint: key.fingerprint,
        type: key.type,
      }
    });
    dialogRef.afterClosed().subscribe(nKey => {
      if (nKey !== undefined) {
        if (nKey.domain.startsWith('http://')) {
          nKey.domain = nKey.domain.substring(7);
        } else if (nKey.domain.startsWith('https://')) {
          nKey.domain = nKey.domain.substring(8);
        }
        this.keysService.editKey(
          nKey.id,
          nKey.subject,
          nKey.domain,
          nKey.email,
          nKey.content,
          nKey.fingerprint,
          nKey.vocabulary)
          .subscribe(res2 => {
            this.getKeys();
            this.keysService.evictCache('public-key.' + nKey.fingerprint).subscribe(res3 => {
              console.log(res3);
            });
          }, error => {
            this.snackBar.open(error.error.message, 'ok');
          });
      }
    });
  }

  deleteKey(id: number) {
    this.keysService.deleteKey(id).subscribe(res => {
      this.keysService.getKeys(this.filter).subscribe(res => {
        this.keys = res || [];
      });
    });
  }

  getInvocations() {
    this.evaluatorService.invocations(this.invocationsFilter).subscribe(res => {
      this.invocations = res;
      this.evaluatorService.countInvocations(this.invocationsFilter).subscribe(res => {
        this.invocationsCount = res.count;
      });
    });
  }

  paged(e: PageEvent) {
    this.invocationsFilter.offset = e.pageSize * e.pageIndex;
    this.getInvocations();
  }

  viewReceipt(el: any) {
    if (el.viewReceipt && el.viewReceipt === true) {
      el.viewReceipt = false;
    }
    else if (el.viewReceipt && el.viewReceipt === false) {
      el.viewReceipt = true;
    } else {
      el.viewReceipt = true;
    }
  }
}
