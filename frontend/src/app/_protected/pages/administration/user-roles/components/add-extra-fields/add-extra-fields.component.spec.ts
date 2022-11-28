import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExtraFieldsComponent } from './add-extra-fields.component';

describe('AddExtraFieldsComponent', () => {
  let component: AddExtraFieldsComponent;
  let fixture: ComponentFixture<AddExtraFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddExtraFieldsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExtraFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
