import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Message } from 'src/app/models/message.model';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import fileTypes from 'src/app/codemirror/file-types.json';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Message wrapper for what message to publish.
 */
 export class MessageWrapper {

  /**
   * the actual message to publish.
   */
  message?: Message;

  /**
   * Client/connection to publish it to.
   */
  client?: string;

  /**
   * Groups to publish it to.
   */
  groups?: string

  /**
   * Roles to publish it to.
   */
  roles?: string;
}

@Component({
  selector: 'app-publish-dialog',
  templateUrl: './publish-dialog.component.html',
  styleUrls: ['./publish-dialog.component.scss']
})
export class PublishDialogComponent implements OnInit {



  // Known file extensions we've got editors for.
  // Used to make sure we reuse default JSON settings for CodeMirror editor.
  private extensions = fileTypes;

  /**
   * CodeMirror options for JSON file types.
   */
   public options: any = null;

  /**
   * Creates an instance of your component.
   *
   * @param dialogRef Needed to be able to close dialog
   * @param data Injected data to be returned to caller once closed
   */
  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<PublishDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageWrapper) { }

    ngOnInit(): void {

    }

  /**
   * Implementation of AfterViewInit.
   *
   * Needed to be able to correctly initialise CodeMirror editor, to avoid 'race conditions',
   * since it cannot be initialised until after all CSS animations and initialisation code
   * has executed.
   */
  ngAfterViewInit() {

    // This looks a bit funny, but due to the way CodeMirror is wired together it's unfortunately necessary ...
    setTimeout(() => {

      // Making sure we find the correct options for our CodeMirror editor.
      this.options = this.extensions.filter(x => x.extensions.indexOf('json') !== -1)[0].options;

      // Turning OFF autofocus such that user starts filling out form at 'the top'.
      this.options.autofocus = false;

    }, 1000);

    setTimeout(() => {
      var domNode = (<any>document.querySelector('.CodeMirror'));
      var editor = domNode.CodeMirror;
      editor.doc.markClean();
      editor.doc.clearHistory(); // To avoid having initial loading of file becoming an "undo operation".
    }, 800);
  }

  /**
   * Invoked when user wants to send message.
   */
  public send() {
    if (!this.good()) {
      this.generalService.showFeedback('Your code is not valid', 'errorMessage');
      return;
    }
    // Closing dialog making sure we provide data to caller.
    this.dialogRef.close(this.data);
  }

  /**
   * Returns false if JSON is not valid.
   */
  public good() {

    // A bit of a hack, but it works.
    try {
      JSON.parse(this.data.message.content);
      if (this.data.message.name === null || this.data.message.name === '') {
        return false;
      }
      if ([this.data.client, this.data.groups, this.data.roles].filter(x => x !== null && x !== '').length > 1) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

}
