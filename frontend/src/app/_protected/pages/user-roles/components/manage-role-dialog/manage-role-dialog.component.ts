import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Role } from '../../_models/role.model';
import { RoleService } from '../../_services/role.service';

@Component({
  selector: 'app-manage-role-dialog',
  templateUrl: './manage-role-dialog.component.html',
  styleUrls: ['./manage-role-dialog.component.scss']
})
export class ManageRoleDialogComponent implements OnInit {

  public isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<ManageRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      role?: Role,
      action: string // edit || new
    }) { }

  roleForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]]
  })

  ngOnInit(): void {
    (async () => {
      while (this.data && !Object.keys(this.data).length)
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.data && Object.keys(this.data).length > 0) {
        if (this.data?.role) {
          this.roleForm.patchValue({
            name: this.data.role.name,
            description: this.data.role.description
          })
        }
      }
    })();
  }

  save() {
    if (this.roleForm.valid) {
      this.isLoading = true;
      if (this.data.action === 'edit') {
        this.roleService.update(this.roleForm.value.name, this.roleForm.value.description).subscribe({
          next: () => {
            this.generalService.showFeedback('Role was successfully updated.', 'successMessage', 'Ok', 4000);
            this.isLoading = false;
            this.dialogRef.close('saved')
          },
          error: (error: any) => {
            this.isLoading = false;
            this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)
        }});
      } else {
        this.roleService.create(this.roleForm.value.name, this.roleForm.value.description).subscribe({
          next: () => {
            this.generalService.showFeedback('Role was successfully updated.', 'successMessage', 'Ok', 4000);
            this.isLoading = false;
            this.dialogRef.close('saved')
          },
          error: (error: any) => {
            this.isLoading = false;
            this.generalService.showFeedback(error, 'errorMessage', 'Ok', 4000)
        }});
      }
    } else {
      this.generalService.showFeedback('Please fill all the fields.', 'errorMessage', 'Ok')
    }
  }

}
