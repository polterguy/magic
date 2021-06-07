
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { AfterViewInit, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Message } from 'src/app/models/message.model';

// CodeMirror options according to file extensions needed to show JSON CodeMirror editor.
import fileTypes from '../../../files/file-editor/file-types.json';

/**
 * Send message component allowing users to provide what message to
 * transmit and what payload to transmit.
 */
@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html'
})
export class SendMessageComponent implements AfterViewInit {

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
    private dialogRef: MatDialogRef<SendMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Message) { }

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
  public notGood() {

    // A bit of a hack, but it works.
    try {
      JSON.parse(this.data.content);
      return true;
    } catch {
      return false;
    }
  }
}
