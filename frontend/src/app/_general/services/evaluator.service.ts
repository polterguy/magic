
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Response } from '../../models/response.model';
import { FileService } from '../../_protected/pages/create/hyper-ide/services/file.service';
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * Hyperlambda evaluator service allowing you to evaluate Hyperlambda in
 * your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  constructor(
    private httpService: HttpService,
    private fileService: FileService) { }

  execute(hyperlambda: string) {
    return this.httpService.post<Response>('/magic/system/evaluator/evaluate', {
      hyperlambda
    });
  }

  snippets() {
    return this.fileService.listFiles('/etc/snippets/');
  }

  loadSnippet(filename: string) {
    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = '/etc/snippets/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }
    return this.fileService.loadFile(filename);
  }

  saveSnippet(filename: string, content: string) {
    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = '/etc/snippets/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }
    return this.fileService.saveFile(filename, content);
  }
}
