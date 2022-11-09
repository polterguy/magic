import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendSearchboxComponent } from './backend-searchbox.component';

describe('BackendSearchboxComponent', () => {
  let component: BackendSearchboxComponent;
  let fixture: ComponentFixture<BackendSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackendSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackendSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
