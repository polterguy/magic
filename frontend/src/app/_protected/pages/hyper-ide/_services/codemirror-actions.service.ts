import { Injectable, NgZone } from '@angular/core';
import CodeMirror from 'codemirror';
import { ReplaySubject } from 'rxjs';
import fileTypes from 'src/app/codemirror/file-types.json';

@Injectable({
  providedIn: 'root'
})
export class CodemirrorActionsService {

  constructor(private ngZone: NgZone) { }

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  public action: ReplaySubject<string> = new ReplaySubject();

  /**
   *
   * @param path If file is to be displayed.
   * @param type If a fixed file type is to be displayed.
   * @returns actions as observable.
   */
  public getActions(path?: any, type?: string) {
    return new Promise((resolve: any) => {
      let options = [];

      if (path) {
        const extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
        options = this.extensions.filter(x => x.extensions.indexOf(extension) !== -1);
      } else if (type) {
        options = this.extensions.filter(x => x.extensions.indexOf(type) !== -1);
      }

      if (options.length === 0) {
        resolve(null);
        return null;
      } else {
        options[0] = this.clone(options[0]);
        if (options[0].options.extraKeys) {
          options[0].options.extraKeys['Alt-M'] = (cm: any) => {
            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
          };
          options[0].options.extraKeys['Alt-S'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('save')
            })
          };
          options[0].options.extraKeys['Alt-D'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('deleteFile');
            })
          };
          options[0].options.extraKeys['Alt-C'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('close');
            })
          };
          options[0].options.extraKeys['Alt-R'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('renameFile');
            })
          };
          options[0].options.extraKeys['Alt-L'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('renameFolder');
            })
          };
          options[0].options.extraKeys['Alt-V'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('insertSnippet');
            })
          };
          options[0].options.extraKeys['Alt-O'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('macro');
            })
          };
          options[0].options.extraKeys['Alt-A'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('newFile');
            })
          };
          options[0].options.extraKeys['Alt-B'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('newFolder');
            })
          };
          options[0].options.extraKeys['Alt-X'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('deleteFolder');
            })
          };
          options[0].options.extraKeys['Alt-P'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('preview');
            })
          };
          options[0].options.extraKeys['F5'] = (cm: any) => {
            this.ngZone.run(() => {
              this.action.next('execute');
            })
          };
          if (type === 'sql') {
            options[0].options.extraKeys['Ctrl-Space'] = (cm: any) => {
              this.ngZone.run(() => {
                cm.showHint({
                  hint: CodeMirror.hint.sql,
                  completeSingle: false,
                });
              })
            };
          }
        }
        resolve(options[0].options)
      }
    })
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
