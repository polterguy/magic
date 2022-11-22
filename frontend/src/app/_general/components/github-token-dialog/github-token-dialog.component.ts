import { Component, Inject, OnInit } from '@angular/core';
import { CryptoService } from 'src/app/_protected/pages/setting-security/server-key-setting/_services/crypto.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from '../../services/general.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-github-token-dialog',
  templateUrl: './github-token-dialog.component.html',
  styleUrls: ['./github-token-dialog.component.scss']
})
export class GithubTokenDialogComponent implements OnInit {

  public token: string = '';

  constructor(
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: { username: string, role: string, expires: string }) { }

  ngOnInit(): void {
    this.getKey();
  }

  public getKey() {
    this.cryptoService.getGithubKey(this.data.username,this.data.role, this.data.expires).subscribe({
      next: (res: any) => {
        this.token = res.ticket;
      },
      error: (error: any) => {}
    })
  }

  public copy() {
    this.clipboard.copy(this.token);
  }
}
