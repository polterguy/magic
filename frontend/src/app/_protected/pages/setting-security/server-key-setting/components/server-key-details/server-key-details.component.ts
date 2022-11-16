import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { PublicKey } from '../../_models/public-key.model';
import { CryptoService } from '../../_services/crypto.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/tools/hyper-ide/_services/codemirror-actions.service';

// CodeMirror options.
import hyperlambda from 'src/app/codemirror/options/hyperlambda.json';

@Component({
  selector: 'app-server-key-details',
  templateUrl: './server-key-details.component.html',
  styleUrls: ['./server-key-details.component.scss']
})
export class ServerKeyDetailsComponent implements OnInit {

  public username: string = '';

  constructor(
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(MAT_DIALOG_DATA) public data: { key: any, savePermission: boolean }) { }

  ngOnInit(): void {
    this.getUserAssociation();
    this.getCodeMirrorOptions();
  }

  /**
   * Invoked when detailed view is requested for the specified key.
   */
  private getUserAssociation() {
    if (!this.data.key.username) {
      this.cryptoService.getUserAssociation(this.data.key.id).subscribe({
        next: (result: any) => this.data.key.username = result.result,
        error: (error: any) => this.generalService.showFeedback(error.error.message??error, 'errorMessage')});
    }
  }

  public copy(text: string) {
    this.clipboard.copy(text);
    this.generalService.showFeedback('Copied to your clipboard');
  }

  private async getCodeMirrorOptions() {
    this.codemirrorActionsService.getActions(null, 'hl').then((option: any) => {
      const hlOptions: any = {
        hyperlambda: this.data.key.vocabulary,
        options: option
      }
      this.data.key.options = hlOptions;
     });
  }
}
