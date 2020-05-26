
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EvaluatorService } from '../../services/evaluator-service';
import { LegendDialogComponent } from './modals/legend-dialog';
import { MatDialog } from '@angular/material';
import { FileDialogComponent } from './modals/file-dialog';
import { FileService } from 'src/app/services/file-service';

@Component({
  selector: 'app-evaluator',
  templateUrl: './evaluator.component.html',
  styleUrls: ['./evaluator.component.scss']
})
export class EvaluatorComponent implements OnInit {
  private hyperlambda = '';
  private filename: string;
  private result: string = null;

  constructor(
    private service: EvaluatorService,
    private fileService: FileService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog) { }

  ngOnInit() {
    this.service.vocabulary().subscribe((res) => {
      localStorage.setItem('vocabulary', JSON.stringify(res));
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
      theme: 'material',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
        F11: (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
          console.log(cm);
        },
        Esc: (cm: any) => {
          if (cm.getOption('fullScreen')) {
            cm.setOption('fullScreen', false);
          }
        },
      }
    };
    if (execute) {
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
    }
    return result;
  }

  load() {
    const dialogRef = this.dialog.open(FileDialogComponent, {
      width: '700px',
      data: {
        path: '',
        content: '',
        select: true,
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
    const dialogRef = this.dialog.open(FileDialogComponent, {
      width: '700px',
      data: {
        path: '',
        content: '',
        select: false,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
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
      width: '700px',
    });
  }
}
