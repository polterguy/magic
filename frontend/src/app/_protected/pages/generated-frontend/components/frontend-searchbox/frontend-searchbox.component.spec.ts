import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontendSearchboxComponent } from './frontend-searchbox.component';

describe('FrontendSearchboxComponent', () => {
  let component: FrontendSearchboxComponent;
  let fixture: ComponentFixture<FrontendSearchboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrontendSearchboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontendSearchboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
