
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { UsersService } from 'src/app/services/users-service';

export interface AddRoleDialogData {
  name: string;
}

@Component({
  templateUrl: 'add-role-dialog.html',
})
export class AddRoleDialogComponent implements OnInit {

  public roles: any[];

  ngOnInit(): void {
    this.usersService.getAllRoles().subscribe(res => {
      this.roles = res;
    });
  }

  constructor(
    private usersService: UsersService,
    public dialogRef: MatDialogRef<AddRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddRoleDialogData) {}

  close(): void {
    this.dialogRef.close();
  }
}
