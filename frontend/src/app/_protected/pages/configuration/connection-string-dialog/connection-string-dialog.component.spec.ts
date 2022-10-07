import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionStringDialogComponent } from './connection-string-dialog.component';

describe('ConnectionStringDialogComponent', () => {
  let component: ConnectionStringDialogComponent;
  let fixture: ComponentFixture<ConnectionStringDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectionStringDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionStringDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
