import { Component, EventEmitter, NgZone, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { FileService } from 'src/app/services/file.service';
import { GenerateCrudAppComponent } from '../../generate-crud-app/generate-crud-app.component';

@Component({
  selector: 'app-general-actions',
  templateUrl: './general-actions.component.html',
  styleUrls: ['./general-actions.component.scss']
})
export class GeneralActionsComponent implements OnInit {

  @Output() updateFiles: EventEmitter<any> = new EventEmitter();

  /**
   * Model for file uploader.
   */
  public zipFileInput: any;

  /**
   * Needed to be kept around such that we can explicitly close it after having CRUDified some database/table.
   */
   private generateCrudDialog: MatDialogRef<GenerateCrudAppComponent> = null;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogs
   * @param authService Needed to verify access to components
   * @param fileService Needed to load and save files.
   * @param feedbackService Needed to display feedback to user
   * @param evaluatorService Needed to retrieve vocabulary from backend, in addition to executing Hyperlambda files
   * @param ngZone Needed to make sure dialogs popup inside the ngZone
   */
   constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private fileService: FileService,
    private feedbackService: FeedbackService,
    readonly ngZone: NgZone
  ) { }

  ngOnInit(): void {
  }

  /**
   * Invoked when user wants to generate a CRUD app.
   */
   public generateCrudApp() {

    // Opening modal dialog allowing user to generate a CRUD app.
    // using ngZone to prevent the dialog from opening outside of the ngZone!
    this.ngZone.run(() => {
      this.generateCrudDialog = this.dialog.open(GenerateCrudAppComponent, {
        width: '80%',
        disableClose: true
      });
    })

    // Making sure we can still close the dialog when the obscurer is clicked.
    this.generateCrudDialog.backdropClick().subscribe(() => {
      this.generateCrudDialog.close();
    })
  }

  /**
   * Uploads and installs a zip file on the server.
   * 
   * @param file Zip file to upload and install
   */
   public installModule(file: FileList) {

    // Sanity checking that file is a zip file.
    if (file[0].name.split('.')[1] === 'zip') {
      this.fileService.installModule(file.item(0)).subscribe(() => {
        
        // Showing some feedback to user, and re-databinding folder's content.
        this.feedbackService.showInfo('File was successfully uploaded');
        this.zipFileInput = null;
        this.updateFiles.emit('/modules/');
      });
    } else {
      this.feedbackService.showInfo('Only zip files without . are accepted');
    }
  }
}
