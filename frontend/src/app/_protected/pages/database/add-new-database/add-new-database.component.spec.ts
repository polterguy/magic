import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewDatabaseComponent } from './add-new-database.component';

describe('AddNewDatabaseComponent', () => {
  let component: AddNewDatabaseComponent;
  let fixture: ComponentFixture<AddNewDatabaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddNewDatabaseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewDatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
