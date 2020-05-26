
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
  templateUrl: 'load-dialog.html',
  styleUrls: ['load-dialog.scss'],
})
export class LoadDialogComponent implements OnInit {

  public files: string[] = [];
  public displayedColumns: string[] = ['filename'];

  constructor(
    public dialogRef: MatDialogRef<LoadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fileService: FileService) { }

  ngOnInit() {
    this.fileService.listFiles('/misc/snippets/').subscribe(res => {
      this.files = res.filter(x => x.endsWith('.hl'));
    });
  }

  getFilteredFiles() {
    return this.files;
  }

  getFileName(path: string) {
    return path.substr(path.lastIndexOf('/') + 1);
  }

  selectFile(file: string) {
    this.fileService.getFileContent(file).subscribe(res => {
      this.data.content = res;
      this.dialogRef.close(this.data);
    });
  }
}
