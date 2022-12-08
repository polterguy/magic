import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForeignKeyListComponent } from './foreign-key-list.component';

describe('ForeignKeyListComponent', () => {
  let component: ForeignKeyListComponent;
  let fixture: ComponentFixture<ForeignKeyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForeignKeyListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForeignKeyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
