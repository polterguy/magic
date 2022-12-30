
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable, NgZone } from '@angular/core';
import CodeMirror from 'codemirror';
import { Subject } from 'rxjs';
import fileTypes from 'src/app/codemirror/file-types.json';

/**
 * CodeMirror keyboard shortcut action service for listening to keyboard shortcuts.
 */
@Injectable({
  providedIn: 'root'
})
export class CodemirrorActionsService {

  private extensions = fileTypes;
  action: Subject<string> = new Subject();

  constructor(private ngZone: NgZone) { }

  public getActions(path?: string, type?: string) {
    let options = [];

    if (path) {
      const extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
      options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
    } else if (type) {
      options = this.extensions.filter(x => x.extensions.indexOf(type) !== -1);
    }

    if (options.length === 0) {
      return null;
    } else {
      const res = this.clone(options[0]);
      if (res.options.extraKeys) {
        res.options.extraKeys['Alt-M'] = (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        };
        res.options.extraKeys['Alt-S'] = () => {
          this.ngZone.run(() => {
            this.action.next('save')
          })
        };
        res.options.extraKeys['Alt-D'] = () => {
          this.ngZone.run(() => {
            this.action.next('deleteFile');
          })
        };
        res.options.extraKeys['Alt-C'] = () => {
          this.ngZone.run(() => {
            this.action.next('close');
          })
        };
        res.options.extraKeys['Alt-R'] = () => {
          this.ngZone.run(() => {
            this.action.next('renameFile');
          })
        };
        res.options.extraKeys['Alt-L'] = () => {
          this.ngZone.run(() => {
            this.action.next('renameFolder');
          })
        };
        res.options.extraKeys['Alt-V'] = () => {
          this.ngZone.run(() => {
            this.action.next('insertSnippet');
          })
        };
        res.options.extraKeys['Alt-O'] = () => {
          this.ngZone.run(() => {
            this.action.next('macro');
          })
        };
        res.options.extraKeys['Alt-A'] = () => {
          this.ngZone.run(() => {
            this.action.next('newFile');
          })
        };
        res.options.extraKeys['Alt-B'] = () => {
          this.ngZone.run(() => {
            this.action.next('newFolder');
          })
        };
        res.options.extraKeys['Alt-X'] = () => {
          this.ngZone.run(() => {
            this.action.next('deleteFolder');
          })
        };
        res.options.extraKeys['Alt-P'] = () => {
          this.ngZone.run(() => {
            this.action.next('preview');
          })
        };
        res.options.extraKeys['F5'] = () => {
          this.ngZone.run(() => {
            this.action.next('execute');
          })
        };
        if (type === 'sql') {
          res.options.extraKeys['Ctrl-Space'] = (cm: any) => {
            this.ngZone.run(() => {
              cm.showHint({
                hint: CodeMirror.hint.sql,
                completeSingle: false,
              });
            })
          };
        }
      }
      return res.options;
    }
  }

  /*
   * Helper method to clone any object.
   */
  private clone(obj: any) {
    var cloneObj: any = {};
    for (var attribut in obj) {
      if (typeof obj[attribut] === "object") {
        cloneObj[attribut] = this.clone(obj[attribut]);
      } else {
        cloneObj[attribut] = obj[attribut];
      }
    }
    return cloneObj;
  }
}
