import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerKeyDetailsComponent } from './server-key-details.component';

describe('ServerKeyDetailsComponent', () => {
  let component: ServerKeyDetailsComponent;
  let fixture: ComponentFixture<ServerKeyDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerKeyDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerKeyDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
