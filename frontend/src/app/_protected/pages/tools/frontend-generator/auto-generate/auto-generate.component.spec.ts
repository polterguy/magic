import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoGenerateComponent } from './auto-generate.component';

describe('AutoGenerateComponent', () => {
  let component: AutoGenerateComponent;
  let fixture: ComponentFixture<AutoGenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoGenerateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoGenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
