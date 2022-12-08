import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerKeyTableComponent } from './server-key-table.component';

describe('ServerKeyTableComponent', () => {
  let component: ServerKeyTableComponent;
  let fixture: ComponentFixture<ServerKeyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerKeyTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerKeyTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
