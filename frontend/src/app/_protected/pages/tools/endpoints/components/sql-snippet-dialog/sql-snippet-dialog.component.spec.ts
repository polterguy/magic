import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlSnippetDialogComponent } from './sql-snippet-dialog.component';

describe('SqlSnippetDialogComponent', () => {
  let component: SqlSnippetDialogComponent;
  let fixture: ComponentFixture<SqlSnippetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqlSnippetDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SqlSnippetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
