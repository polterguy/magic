import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { FileService } from 'src/app/services--/file.service';

@Component({
  selector: 'app-confirm-uninstall-dialog',
  templateUrl: './confirm-uninstall-dialog.component.html'
})
export class ConfirmUninstallDialogComponent implements OnInit {

  constructor(
    private fileService: FileService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<ConfirmUninstallDialogComponent>) { }

  ngOnInit(): void {
  }

  uninstallPlugin() {
    this.fileService.deleteFolder('/modules/' + this.data + '/').subscribe({
      next: (res: any) => {
        this.dialogRef.close('confirmed');
        this.feedbackService.showInfo(this.data + ' uninstalled successfully.')
      },
      error: (error: any) => { this.feedbackService.showError(error) }
    });
  }
}
