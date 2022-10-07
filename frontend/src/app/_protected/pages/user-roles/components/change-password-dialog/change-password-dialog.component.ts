import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { User } from '../../_models/user.model';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {

  /**
   * Stores the given password.
   */
  public password: string = '';

  /**
   * Toggles password's visibility.
   */
  public showPassword: boolean = false;

  /**
   * Sets to true while password is saving.
   */
  public isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private backendService: BackendService,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: User) { }

  ngOnInit(): void {
  }

  /**
   * Invokes endpoint to save the new password.
   */
  public save() {
    if (this.password !== '') {
      this.isLoading = true;
      this.backendService.changePassword(this.password).subscribe({
        next: () => {
          this.generalService.showFeedback('New password is saved successfully', 'successMessage', 'Ok', 3000);
          this.isLoading = false;
          this.dialogRef.close();
        },
        error: (error: any) => this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)});
    } else {
      this.generalService.showFeedback('Please give a password to save.')
    }
  }

}
