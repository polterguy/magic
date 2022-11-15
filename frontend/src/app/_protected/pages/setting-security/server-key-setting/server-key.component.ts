import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { PublicKeyFull } from './_models/public-key-full.model';
import { CryptoService } from './_services/crypto.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { PublicKey } from './_models/public-key.model';

@Component({
  selector: 'app-server-key',
  templateUrl: './server-key.component.html',
  styleUrls: ['./server-key.component.scss']
})
export class ServerKeyComponent implements OnInit {

  /**
   * Server's public key information.
   */
  public publicKeyFull: PublicKeyFull = null;

  public selectedTabIndex: number = 0;

  public selectedServerKey: PublicKey;

  public isNewKey: boolean = undefined;

  constructor(
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private generalService: GeneralService) { }

  ngOnInit(): void {
    this.getServerPublicKey();
  }

  /*
   * Retrieves the server's public key.
   */
  private getServerPublicKey() {
    this.cryptoService.serverPublicKey().subscribe({
      next: (key: any) => {
        if (key.result === 'FAILURE') {
          this.generalService.showFeedback('No server key pair found, please create one', 'errorMessage');
          return;
        }
        this.publicKeyFull = <PublicKeyFull>key;
      },
      error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
  }

  public copy(text: string) {
    this.clipboard.copy(text);
    this.generalService.showFeedback('Copied to your clipboard');
  }

  public tabChanged(event: any) {
    this.selectedTabIndex = event;
  }

  public invokeViewReceipts(event: any) {
    if (event.key === this.selectedServerKey) {
      this.isNewKey = false;
    } else {
      this.isNewKey = true;
    }
    this.selectedServerKey = event.key;
    this.selectedTabIndex = event.index;
  }
}
