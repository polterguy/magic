
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { GeneralService } from 'src/app/_general/services/general.service';
import { FileService } from '../../hyper-ide/_services/file.service';

@Component({
  selector: 'app-upload-existing',
  templateUrl: './upload-existing.component.html',
  styleUrls: ['./upload-existing.component.scss']
})
export class UploadExistingComponent implements OnInit {

  /**
  * selected file
  */
  public file: any;

  /**
 * specifies if the file is being uploaded.
 */
  public uploading: boolean = false;

  constructor(
    private generalService: GeneralService,
    private fileService: FileService) { }

  ngOnInit(): void {

  }

  /**
   * getting the selected file to upload
   * @param event
   */
  public getFile(event: any) {
    this.uploading = true;
    this.file = event.target.files[0];

    const formData = new FormData();
    formData.append("file", this.file, this.file.name);
    formData.append("folder", '/etc/www/');

    this.fileService.uploadStaticWebsite(formData).subscribe({
      next: (res: any) => {
        this.uploading = false;
        this.generalService.showFeedback('Website successfully uploaded to /etc/www/', 'successMessage', 'Ok', 4000);
      },
      error: (error: any) => {
        this.uploading = false;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000);
      }
    })
  }
}
