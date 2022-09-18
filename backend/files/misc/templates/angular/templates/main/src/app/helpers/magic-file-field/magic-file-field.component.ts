// Angular and system imports.
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, EventEmitter, Input, Output } from '@angular/core';

// Application specific imports.
import { HttpService } from '@app/services/http-service';
import { MessageService } from '@app/services/message.service';

/**
 * File uploader component, allowing you to browse for and upload a file.
 * Example usage can be found below.

  <app-magic-file-field
    *ngIf="canEditColumn('filename')"
    [model]="data.entity"
    field="filename"
    [label]="'filename' | translate"
    class="entity-edit-field"
    uploadUrl="/YOUR_MODULE_NAME/upload-file"
    (change)="changed('filename')">
  </app-magic-file-field>

 */
@Component({
  selector: 'app-magic-file-field',
  templateUrl: './magic-file-field.component.html',
  styleUrls: ['./magic-file-field.component.scss'],
})
export class MagicFileFieldComponent {
  /**
   * Model you're databinding towards.
   */
  @Input() public model: any;

  /**
   * Key in the model, that you want this particular object
   * to be databound towards.
   */
  @Input() public field: string;

  /**
   * Placeholder value (tooltip) of component.
   */
  @Input() public label: string;

  /**
   * Callback to invoke once item is changed.
   */
  @Output() public change: EventEmitter<any> = new EventEmitter();

  /**
   * Creates an instance of your component.
   */
  constructor() { }

  public getFileName(content: string) {
    if (!content) {
      return '';
    }
    return content.substring(0, content.indexOf(';'));
  }

  /**
   * Invoked when file uploader should be clicked.
   */
  public clickFileUploader() {

    // Simply clicking file uploader element to trigger 'browse for files'.
    document.getElementById('file_' + this.field).click()
  }

  /**
   * Invoked as user clicks the button to select a file.
   */
  public uploadFile(e: any) {

    // Retrieving selected file and uploading to server.
    const selectedFile = e.target.files[0];
    let fileContent = selectedFile.name + ';';
    let reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      fileContent += reader.result;
      this.model[this.field] = fileContent;
    };
    reader.onerror = (error) => {
      console.error(error);
    };
  }
}
