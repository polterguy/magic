import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRoleDialogComponent } from './manage-role-dialog.component';

describe('ManageRoleDialogComponent', () => {
  let component: ManageRoleDialogComponent;
  let fixture: ComponentFixture<ManageRoleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageRoleDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
