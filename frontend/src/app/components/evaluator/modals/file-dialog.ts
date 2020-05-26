
import {
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';
import { FileService } from 'src/app/services/file-service';

export interface DialogData {
  path: string;
  content: string;
}

@Component({
  templateUrl: 'file-dialog.html',
  styleUrls: ['file-dialog.scss'],
})
export class FileDialogComponent implements OnInit {

  public files: string[] = [];
  public displayedColumns: string[] = ['filename'];
  public name = '';

  constructor(
    public dialogRef: MatDialogRef<FileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fileService: FileService) { }

  ngOnInit() {
    this.fileService.listFiles('/misc/snippets/').subscribe(res => {
      this.files = res.filter(x => x.endsWith('.hl'));
    });
  }

  getFilteredFiles() {
    if (this.name === '') {
      return this.files;
    }
    return this.files.filter(x => x.includes(this.name));
  }

  getFileName(path: string) {
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.lastIndexOf('.'));
  }

  selectFile(file: string) {
    this.fileService.getFileContent(file).subscribe(res => {
      this.data.content = res;
      this.data.path = file;
      this.dialogRef.close(this.data);
    });
  }
}
