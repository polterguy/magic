
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { AfterViewInit, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Message } from 'src/app/models/message.model';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import fileTypes from 'src/app/codemirror/file-types.json';

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

/**
 * Send message component allowing users to provide what message to
 * transmit and what payload to transmit.
 */
@Component({
  selector: 'app-publish',
  templateUrl: './publish.component.html'
})
export class PublishComponent implements AfterViewInit {

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
    private dialogRef: MatDialogRef<PublishComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageWrapper) { }

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

    }, 500);

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
