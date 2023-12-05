import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarUserDeskComponent } from './sidebar-userdesk.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CategoriaService } from 'src/app/service/categoria.service';
import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

describe('SidebarUserDeskComponent', () => {
  let component: SidebarUserDeskComponent;
  let fixture: ComponentFixture<SidebarUserDeskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SidebarUserDeskComponent],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        MatIconModule,
      ],
      providers: [
        ChangeDetectorRef,
        CategoriaService,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    });

    fixture = TestBed.createComponent(SidebarUserDeskComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
