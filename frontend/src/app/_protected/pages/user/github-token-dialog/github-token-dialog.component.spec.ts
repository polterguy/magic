import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubTokenDialogComponent } from './github-token-dialog.component';

describe('GithubTokenDialogComponent', () => {
  let component: GithubTokenDialogComponent;
  let fixture: ComponentFixture<GithubTokenDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GithubTokenDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GithubTokenDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
