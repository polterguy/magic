import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewUser, UsersService } from '@app/services/users-service';

@Component({
  selector: 'app-create-user-dialog',
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss']
})
export class CreateUserDialogComponent {

  /**
   * Username field in the form.
   */
  public username: string = '';

  /**
   * Password fiels in the form.
   */
  public password: string = '';

  /**
   * Whether to show the typed password in a text format or password.
   */
  public showPassword: boolean = false;

  /**
   * Turns to true while the request is being sent.
   */
  public isLoading: boolean = false;

  /**
   * 
   * @param snackbar To show feedback to the user.
   * @param usersService To call createUser endpoint.
   * @param dialogRef To target the current dialog box. Gives the ability to close it programmatically.
   */

  constructor(
    private snackbar: MatSnackBar,
    private usersService: UsersService,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>) { }

  /**
   * Invokes the endpoint to create a new user.
   * @returns If one of the password or username fields are empty.
   */
  public createUser() {
    if (this.username === '' || this.password === '') {
      this.snackbar.open('All fields are required.', null, { duration: 2000 });
      return;
    }
    this.isLoading = true;
    const data: NewUser = {
      username: this.username,
      password: this.password
    }
    this.usersService.createUser(data).subscribe({
      next: (res: any) => {
        this.snackbar.open('User created successfully.', null, { duration: 2000 });
        this.dialogRef.close('saved');
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.snackbar.open('Username is already taken.', 'ok', { duration: 5000 });
        console.log(error);
      }
    })
  }
}
