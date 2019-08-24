
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
    } else if (path.endsWith('.hl')) {
      this.openFile(path);
    } else {
      this.showError('No editor registered for file');
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
}
