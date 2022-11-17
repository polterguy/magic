import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoGeneratorComponent } from './auto-generator.component';

describe('AutoGeneratorComponent', () => {
  let component: AutoGeneratorComponent;
  let fixture: ComponentFixture<AutoGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoGeneratorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
