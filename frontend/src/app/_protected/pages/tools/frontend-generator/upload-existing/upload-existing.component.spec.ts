import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadExistingComponent } from './upload-existing.component';

describe('UploadExistingComponent', () => {
  let component: UploadExistingComponent;
  let fixture: ComponentFixture<UploadExistingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadExistingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadExistingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
