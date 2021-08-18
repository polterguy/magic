
// Angular and system imports.
import { Component, Input } from '@angular/core';
import { environment } from '@env/environment';

/**
 * File view component, allowing you to view and download an individual file
 * associated with a database entity. Below you can find example usage.
 * 

            <p class="details">
              <label>Download</label>
              <app-magic-file-view
                [file]="el.filename"
                downloadUrl="/MODULE_NAME/download-file">
              </app-magic-file-view>
            </p>

 * The component is typically used in the "view details" section of the grid component,
 * allowing the user to download the specified file associated with an entity.
 */
@Component({
  selector: 'app-magic-file-view',
  templateUrl: './magic-file-view.component.html',
  styleUrls: ['./magic-file-view.component.scss'],
})
export class MagicFileViewComponent {

  /**
   * Backend API URL.
   */
  public apiUrl: string = environment.apiUrl;

  /**
   * Relative filename of image to view.
   */
  @Input() public file: string;

  /**
   * Relative download URL to retrieve image.
   */
  @Input() public downloadUrl: string;

  /**
   * Encodes the specified param as q QUERY URI component.
   * 
   * @param param Query parameter to encode
   */
  public encode(param: string) {

    // Simply encoding as QUERY parameter.
    return encodeURIComponent(param);
  }
}
