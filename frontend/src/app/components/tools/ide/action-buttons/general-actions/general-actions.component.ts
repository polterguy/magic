
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { MessageService } from 'src/app/services--/message.service';
import { FileService } from 'src/app/services--/file.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { GenerateCrudAppComponent } from '../../generate-crud-app/generate-crud-app.component';

/**
 * General action button component for executing general actions in Hyper IDE.
 */
@Component({
  selector: 'app-general-actions',
  templateUrl: './general-actions.component.html'
})
export class GeneralActionsComponent implements OnInit, OnDestroy {

  // Needed to be kept around such that we can explicitly close it after having CRUDified some database/table.
  private generateCrudDialog: MatDialogRef<GenerateCrudAppComponent> = null;

  // Subscription allowing us to subscribe to messages relevant for component.
  private subscription: Subscription;

  @Output() updateFiles: EventEmitter<any> = new EventEmitter();

  /**
   * Model for file uploader.
   */
  zipFileInput: any;

  /**
   * Creates an instance of your component.
   *
   * @param dialog Needed to create modal dialogs
   * @param fileService Needed to load and save files.
   * @param backendService Needed to determine user's access rights in backend
   * @param messageService Needed to subscribe to relevant messages published by other components
   * @param feedbackService Needed to display feedback to user
   */
  constructor(
    private dialog: MatDialog,
    private fileService: FileService,
    public backendService: BackendService,
    private messageService: MessageService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit
   */
  ngOnInit() {
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {
      switch (msg.name) {
        case 'magic.folders.update':
        case 'magic.crudifier.frontend-generated-locally':
        case 'magic.crudifier.frontend-generated':
          this.generateCrudDialog?.close();
          break;
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  /**
   * Invoked when user wants to generate a CRUD app.
   */
  generateCrudApp() {
    this.generateCrudDialog = this.dialog.open(GenerateCrudAppComponent, {
      width: '80%',
      disableClose: true
    });
    this.generateCrudDialog.backdropClick().subscribe(() => {
      this.generateCrudDialog.close();
    });
  }

  /**
   * Uploads and installs a zip file on the server.
   *
   * @param file Zip file to upload and install
   */
  installModule(file: FileList) {
    if (file[0].name.split('.')[1] === 'zip') {
      this.fileService.installModule(file.item(0)).subscribe({
        next: () => {
          this.feedbackService.showInfo('File was successfully uploaded');
          this.zipFileInput = null;
          this.updateFiles.emit('/modules/');
        },
        error: (error: any) => this.feedbackService.showError(error)});
    } else {
      this.feedbackService.showInfo('Only zip files without . are accepted');
    }
  }
}
