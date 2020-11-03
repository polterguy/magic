
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { KeysService } from 'src/app/services/keys-service';

export interface ImportKeyDialogData {
  id?: number;
  imported?: Date;
  subject: string;
  domain: string;
  email: string;
  content: string;
  vocabulary: string;
  fingerprint: string;
  type: string;
  enabled: boolean;
  readOnly: boolean;
}

@Component({
  templateUrl: 'import-key-dialog.html',
  styleUrls: ['import-key-dialog.scss']
})
export class ImportKeyDialogComponent implements OnInit {
  public initializedVocabulary = false;

  constructor(
    private keysService: KeysService,
    private evaluatorService: EvaluatorService,
    public dialogRef: MatDialogRef<ImportKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportKeyDialogData) { }

  ngOnInit() {
    this.evaluatorService.vocabulary().subscribe(res => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
      setTimeout(() => {
        this.initializedVocabulary = true;
      }, 250);
    });
    if (!this.data.id) {
      this.data.vocabulary = `/*
 * In order for clients to intelligently communicate with your
 * server, at the very least you should whitelist [vocabulary]
 * and [slots.vocabulary] - Since this allows them to query your
 * server for what slots they're allowed to invoke.
 * 
 * In addition, you should whitelist the [magic.crypto.get-server-public-key]
 * such that they can retrieve your newest RSA key, when you update your
 * old key. The latter allows clients to update the public RSA key they
 * are using to invoke endpoints in your server, if you should for some
 * reasons choose to update your server's key pair.
 */
vocabulary
slots.vocabulary
signal:magic.crypto.get-server-public-key
add
return
`;
    }
  }

  getDate(date: any) {
    return new Date(date).toLocaleString();
  }

  close() {
    this.dialogRef.close();
  }

  keyChanged() {
    if (this.data.content === '') {
      this.data.fingerprint = '';
      return;
    }
    this.keysService.getFingerprint(this.data.content).subscribe(res => {
      this.data.fingerprint = res.fingerprint;
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
      }
    };
  }
}
