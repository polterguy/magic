import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedDatabaseComponent } from './generated-database.component';

describe('GeneratedDatabaseComponent', () => {
  let component: GeneratedDatabaseComponent;
  let fixture: ComponentFixture<GeneratedDatabaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneratedDatabaseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratedDatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
