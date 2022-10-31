import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddArgumentDialogComponent } from './add-argument-dialog.component';

describe('AddArgumentDialogComponent', () => {
  let component: AddArgumentDialogComponent;
  let fixture: ComponentFixture<AddArgumentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddArgumentDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddArgumentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
