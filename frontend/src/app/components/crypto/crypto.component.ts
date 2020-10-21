
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetupService } from 'src/app/services/setup-service';
import { TicketService } from 'src/app/services/ticket-service';
import { KeysService } from 'src/app/services/keys-service';
import { ImportKeyDialogComponent } from './modals/import-key-dialog';
import { MatDialog } from '@angular/material/dialog';

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
    1024,
    2048,
    4096,
    8192
  ];
  public displayedColumns: string[] = [
    'subject',
    'email',
    'url',
    'delete',
  ];
  public keys: any = [];
  public filter = '';

  constructor(
    private ticketService: TicketService,
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
  }

  generate() {
    this.isFetching = true;
    this.service.generateKeyPair(this.seed, this.strength).subscribe((res: any) => {
      this.isFetching = false;
      this.showKey(res);
      this.snackBar.open('Key successfully created', 'ok');
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
      width: '500px',
      data: {
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        if (!res.url.startsWith('http')) {
          res.url = 'https://' + res.url;
        }
        this.keysService.importKey(
          res.subject,
          res.url,
          res.email,
          res.content,
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
      width: '500px',
      data: {
        id: key.id,
        subject: key.subject,
        url: key.url,
        email: key.email,
        content: key.content,
        fingerprint: key.fingerprint,
        type: key.type,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        if (!res.url.startsWith('http')) {
          res.url = 'https://' + res.url;
        }
        this.keysService.editKey(
          res.id,
          res.subject,
          res.url,
          res.email)
          .subscribe(res => {
            this.getKeys();
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

  getUrl(url: string) {
    if (url.startsWith('http://')) {
      return url.substr(7);
    }
    return url.substr(8);
  }
}
