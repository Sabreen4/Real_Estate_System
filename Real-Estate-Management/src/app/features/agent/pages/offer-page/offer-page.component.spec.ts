import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { OffersPageComponent } from './offer-page.component';
import { AgentOffersComponent } from 'src/app/features/agent/components/agent-offer/agent-offer.component';
import { AgentService } from 'src/app/core/services/agent.service';
import { CacheService } from 'src/app/core/services/cache.service';
import { PaginatorModule } from 'src/app/shared/paginator/paginator-module';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

describe('OffersPageComponent', () => {
  let component: OffersPageComponent;
  let fixture: ComponentFixture<OffersPageComponent>;

  beforeEach(async () => {
    const agentSpy = jasmine.createSpyObj('AgentService', [
      'getOffers', 'updateOffer', 'getProperty', 'getUser'
    ]);
    agentSpy.getOffers.and.returnValue(of([]));
    agentSpy.getProperty.and.returnValue(of({}));
    agentSpy.getUser.and.returnValue(of({}));

    const cacheSpy = jasmine.createSpyObj('CacheService', [
      'getOffers', 'setOffers', 'clearOffers'
    ]);
    cacheSpy.getOffers.and.returnValue(null);
    cacheSpy.setOffers.and.stub();
    cacheSpy.clearOffers.and.stub();

    await TestBed.configureTestingModule({
      imports: [CommonModule, PaginatorModule],
      declarations: [OffersPageComponent, AgentOffersComponent],
      schemas: [NO_ERRORS_SCHEMA],                      // ← suppresses app-back-button and any other unknown elements
      providers: [
        { provide: AgentService, useValue: agentSpy },
        { provide: CacheService, useValue: cacheSpy }, // ← AgentOffersComponent injects this
        ChangeDetectorRef,
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(OffersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});