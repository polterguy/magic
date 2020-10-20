
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetupService } from 'src/app/services/setup-service';
import { TicketService } from 'src/app/services/ticket-service';

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

  constructor(
    private ticketService: TicketService,
    private service: SetupService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.service.getPublicKey().subscribe((res: any) => {
      if (res.result !== 'FAILURE') {
        this.showKey(res);
      }
    }, (error: any) => {
      this.snackBar.open(error.error.msg);
    });
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
}
