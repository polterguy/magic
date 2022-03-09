
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, EventEmitter, NgZone, OnDestroy, OnInit, Output } from '@angular/core';

// Application specific imports.
import { Message } from 'src/app/models/message.model';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { FileService } from 'src/app/services/tools/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { GenerateCrudAppComponent } from '../../generate-crud-app/generate-crud-app.component';

/**
 * General action button component for executing general actions in Hyper IDE.
 */
@Component({
  selector: 'app-general-actions',
  templateUrl: './general-actions.component.html',
  styleUrls: ['./general-actions.component.scss']
})
export class GeneralActionsComponent implements OnInit, OnDestroy {

  @Output() updateFiles: EventEmitter<any> = new EventEmitter();

  /**
   * Model for file uploader.
   */
  public zipFileInput: any;

  /**
   * Needed to be kept around such that we can explicitly close it after having CRUDified some database/table.
   */
  private generateCrudDialog: MatDialogRef<GenerateCrudAppComponent> = null;

  /*
   * Subscription allowing us to subscribe to messages relevant for component.
   */
  private subscription: Subscription;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to create modal dialogs
   * @param authService Needed to verify access to components
   * @param fileService Needed to load and save files.
   * @param messageService Needed to subscribe to relevant messages published by other components
   * @param feedbackService Needed to display feedback to user
   * @param ngZone Needed to make sure dialogs popup inside the ngZone
   */
   constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private fileService: FileService,
    private messageService: MessageService,
    private feedbackService: FeedbackService,
    readonly ngZone: NgZone
  ) { }

  /**
   * Implementation of OnInit
   */
  public ngOnInit() {

    /*
     * Subscribing to relevant messages.
     * Notice, this is necessary to make sure we're able to close modal Crudifier dialog
     * once the user performs some sort of "crudify action".
     */
    this.subscription = this.messageService.subscriber().subscribe((msg: Message) => {

      if (msg.name === 'magic.folders.update') {

        // Closing dialog if it is open.
        if (this.generateCrudDialog) {
          this.generateCrudDialog.close();
        }

      } else if (msg.name === 'magic.crudifier.frontend-generated-locally') {

        // Closing dialog if it is open.
        if (this.generateCrudDialog) {
          this.generateCrudDialog.close();
        }

      } else if (msg.name === 'magic.crudifier.frontend-generated') {

        // Closing dialog if it is open.
        if (this.generateCrudDialog) {
          this.generateCrudDialog.close();
        }
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
   public ngOnDestroy() {

    // Making sure we unsubscribe to our subscription.
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
