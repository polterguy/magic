import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmUninstallDialogComponent } from './confirm-uninstall-dialog.component';

describe('ConfirmUninstallDialogComponent', () => {
  let component: ConfirmUninstallDialogComponent;
  let fixture: ComponentFixture<ConfirmUninstallDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmUninstallDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmUninstallDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
