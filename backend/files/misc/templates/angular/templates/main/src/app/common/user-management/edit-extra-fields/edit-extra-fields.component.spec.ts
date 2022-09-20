import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditExtraFieldsComponent } from './edit-extra-fields.component';

describe('EditExtraFieldsComponent', () => {
  let component: EditExtraFieldsComponent;
  let fixture: ComponentFixture<EditExtraFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditExtraFieldsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditExtraFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
