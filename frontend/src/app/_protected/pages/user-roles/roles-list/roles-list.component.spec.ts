import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesListComponent } from './roles-list.component';

describe('RolesListComponent', () => {
  let component: RolesListComponent;
  let fixture: ComponentFixture<RolesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
