
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EvaluatorService } from '../../services/evaluator-service';
import { LegendDialogComponent } from './modals/legend-dialog';
import { MatDialog } from '@angular/material/dialog';
import { FileDialogComponent } from './modals/file-dialog';
import { FileService } from 'src/app/services/file-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent implements OnInit {

  public hyperlambda = '';
  public filename: string;
  public result: string = null;
  public editor: any;
  public files: string[] = [];

  constructor(
    private service: EvaluatorService,
    private fileService: FileService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog) { }

  ngOnInit() {
    this.service.vocabulary().subscribe((res) => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
    });
    this.fileService.listFiles('/misc/snippets/').subscribe(res => {
      this.files = res.filter(x => x.endsWith('.hl')).map(x => {
        const result = x.substr(x.lastIndexOf('/') + 1);
        return result.substr(0, result.lastIndexOf('.'));
        });
    });
  }

  evaluate() {
    this.service.evaluate(this.hyperlambda).subscribe((res) => {
      this.result = res.result;
    }, (error) => {
      this.showHttpError(error);
    });
    return false;
  }

  getCodeMirrorOptions(execute = false) {
    const result: any = {
      lineNumbers: true,
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
        'Alt-M': (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        },
        Esc: (cm: any) => {
          if (cm.getOption('fullScreen')) {
            cm.setOption('fullScreen', false);
          }
        },
      }
    };
    if (execute) {
      result.theme = 'mbo';
      result.extraKeys.F5 = (cm: any) => {
        const element = document.getElementById('executeButton') as HTMLElement;
        element.click();
      };
      result.extraKeys['Alt-L'] = (cm: any) => {
        const element = document.getElementById('loadButton') as HTMLElement;
        element.click();
      };
      result.extraKeys['Alt-S'] = (cm: any) => {
        const element = document.getElementById('saveButton') as HTMLElement;
        element.click();
      };
      result.extraKeys['Alt-A'] = (cm: any) => {
        const element = document.getElementById('saveAsButton') as HTMLElement;
        element.click();
      };
      result.extraKeys['Alt-Q'] = (cm: any) => {
        const element = document.getElementById('infoButton') as HTMLElement;
        element.click();
      };
      result.extraKeys['Alt-P'] = (cm: any) => {
        this.editor = cm;
        const element = document.getElementById('insertButton') as HTMLElement;
        element.click();
      };
      result.autofocus = true;
    } else {
      result.theme = 'bespin';
      result.readOnly = true;
    }
    return result;
  }

  insertSnippet() {

    // Checking if user have something selected
    const selection = this.editor.getSelection();
    if (selection && selection !== '' && this.files.indexOf(selection) !== -1) {

      // Loading file directly, and inserting.
      this.fileService.getFileContent('/misc/snippets/' + selection + '.hl').subscribe(res => {
        this.replaceSelection(res);
      });

    } else {

      this.dialog.open(FileDialogComponent, {
        width: '80%',
        data: {
          path: '',
          content: '',
          select: true,
          header: 'Insert snippet',
          filename: selection && selection.length < 20 ? selection : null,
        }
      }).afterClosed().subscribe(res => {
        if (res) {
          this.replaceSelection(res.content);
        }
      });

    }
  }

  replaceSelection(content: string) {

    // Making sure we append correct number of spaces in front of the thing.
    const start = this.editor.getCursor(true).ch as number;
    const lines = content.split('\n');
    content = '';
    for (const idx of lines) {
      if (content !== '') {
        content += ' '.repeat(start);
      }
      content += idx + '\n';
    }
    this.editor.replaceSelection(content, 'around');
  }

  load() {
    const dialogRef = this.dialog.open(FileDialogComponent, {
      width: '700px',
      data: {
        path: '',
        content: '',
        select: true,
        header: 'Load snippet',
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.hyperlambda = res.content;
        this.filename = res.path;
      }
    });
  }

  save() {
    if (this.filename) {

      // Saving assuming user simply wants to save file as is, with existing filename.
      this.fileService.saveFile(this.filename, this.hyperlambda).subscribe(res => {
        this.showInfo('File was successfully saved');
      });

    } else {

      // Opening up "Save as" dialog.
      this.saveAs();

    }
  }

  saveAs() {

    // Figuring out filename only, minus folder and extension.
    let filename: string = null;
    if (this.filename) {
      filename = this.filename.substr(this.filename.lastIndexOf('/') + 1);
      filename = filename.substr(0, filename.lastIndexOf('.'));
    }

    // Opening up FileDialog passing in filename.
    this.dialog.open(FileDialogComponent, {
      width: '700px',
      data: {
        path: '',
        content: '',
        select: false,
        header: 'Save snippet as',
        filename,
      }
    }).afterClosed().subscribe(res => {
      if (res) {
        this.filename = res.path;
        this.save();
      }
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showInfo(text: string) {
    this.snackBar.open(text, 'Close', {
      duration: 1000,
    });
  }

  public showLegend() {
    this.dialog.open(LegendDialogComponent, {
      width: '80%',
    });
  }
}
