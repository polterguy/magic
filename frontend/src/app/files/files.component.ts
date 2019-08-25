
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileService } from '../services/file-service';
import { EvaluatorService } from '../services/evaluator-service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  private displayedColumns: string[] = ['path'];
  private path: string = '/';
  private folders: string[] = [];
  private files: string[] = [];
  private fileContent: string;
  private filePath: string;

  constructor(
    private fileService: FileService,
    private evaluateService: EvaluatorService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getPath();
  }

  getPath() {
    this.fileService.listFiles(this.path).subscribe((res) => {
      this.files = res;
    });
    this.fileService.listFolders(this.path).subscribe((res) => {
      this.folders = res;
    });
  }

  dataSource() {
    let result = this.folders.concat(this.files);
    return result;
  }

  selectPath(path: string) {
    if (path.endsWith('/')) {
      this.path = path;
      this.getPath();
    } else {
      const mode = this.getMode(path);
      if (mode == null) {
        this.showError('No editor registered for file');
      } else{
        this.openFile(path);
      }
    }
  }

  upOneFolder() {
    let splits = this.path.split('/');
    splits.splice(-2, 1);
    this.path = splits.join('/');
    this.getPath();
    return false;
  }

  openFile(path: string) {
    this.fileService.getFileContent(path).subscribe((res) => {
      this.fileContent = res;
      this.filePath = path;
    })
  }

  getOptions() {
    return {
      lineNumbers: true,
      theme: 'material',
      mode: this.getMode(this.filePath),
      tabSize: 3,
      indentUnit: 3,
      indentAuto:true,
      extraKeys:{
        'Shift-Tab':'indentLess',
        'Tab':'indentMore'
      }
    };
  }

  getMode(path: string) {
    const fileEnding = path.substr(path.lastIndexOf('.') + 1);
    switch(fileEnding) {
      case 'hl':
        return 'hyperlambda';
      case 'md':
        return 'markdown';
      case 'js':
        return 'jsx';
      case 'css':
        return 'css';
      case 'htm':
      case 'html':
        return 'htmlmixed';
      default:
        return null;
    }
  }

  evaluate() {
    this.evaluateService.evaluate(this.fileContent).subscribe((res) => {
      this.showInfo('File successfully evaluated');
    });
    return false;
  }

  save() {
    this.fileService.saveFile(this.filePath, this.fileContent).subscribe((res) => {
      this.showInfo('File successfully saved');
    });
    return false;
  }

  close() {
    this.fileContent = null;
    this.filePath = null;
    return false;
  }

  showInfo(info: string) {
    this.snackBar.open(info, 'Close', {
      duration: 2000
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 2000,
      panelClass: ['error-snackbar'],
    });
  }
}
