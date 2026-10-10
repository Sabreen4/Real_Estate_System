import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router }              from '@angular/router';
import { of, throwError, Subject }             from 'rxjs';
import { NgForm }                              from '@angular/forms';
import { FormsModule }                         from '@angular/forms';

import { PropertiesComponent }  from './properties.component';
import { AgentPropertyService } from 'src/app/core/services/agent-property.service';
import { AuthService }          from 'src/app/core/services/auth.service';
import { Property }             from 'src/app/core/models/property.model';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeProperty(overrides: Partial<any> = {}): Property {
  return {
    id: 1, title: 'Test', description: 'Desc',
    city: 'Chennai', state: 'TN', zipCode: '600001',
    price: 5000000, size: 1200,
    propertyTypeId: 40, listingTypeId: 70, statusId: 100,
    userId: 42, agentId: 42, ownerId: 42, createdBy: 42,
    status: 'Active', listingType: 'For Sale', propertyType: 'Apartment',
    imageUrl: undefined, images: [],
    ...overrides,
  } as any;
}

function makeForm(valid = true): NgForm {
  return { invalid: !valid } as any;
}

const emptyProps = { items: [], totalCount: 0 };

// ── suite ─────────────────────────────────────────────────────────────────────

describe('PropertiesComponent', () => {
  let component:  PropertiesComponent;
  let fixture:    ComponentFixture<PropertiesComponent>;
  let svcSpy:     jasmine.SpyObj<AgentPropertyService>;
  let authSpy:    jasmine.SpyObj<AuthService>;
  let routerSpy:  jasmine.SpyObj<Router>;
  let queryParams$: Subject<any>;

  const defaultToken = { firstName: 'John', lastName: 'Doe', sub: '42' };

  beforeEach(async () => {
    queryParams$ = new Subject();

    svcSpy = jasmine.createSpyObj('AgentPropertyService', [
      'getAgentProperties', 'createProperty', 'updateProperty',
      'deleteProperty', 'uploadImages', 'getImages', 'deleteImages',
    ]);
    authSpy   = jasmine.createSpyObj('AuthService', ['decodeToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
    authSpy.decodeToken.and.returnValue(defaultToken);

    await TestBed.configureTestingModule({
      declarations: [PropertiesComponent],
      imports:      [FormsModule],
      schemas:      [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AgentPropertyService, useValue: svcSpy   },
        { provide: AuthService,          useValue: authSpy  },
        { provide: Router,               useValue: routerSpy },
        { provide: ActivatedRoute,
          useValue: { queryParams: queryParams$.asObservable() } },
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(PropertiesComponent);
    component = fixture.componentInstance;

    // Real CDR instance — avoids detectChanges/markForCheck errors
    const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    (component as any).cdr = cdr;

    fixture.detectChanges(); // triggers ngOnInit
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  /* ─── ngOnInit ──────────────────────────────────────────────────────── */

  describe('ngOnInit', () => {
    it('should call loadProperties on init', () => {
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    });

    it('should decode token and set agentName / agentUserId', () => {
      expect(component.agentName).toBe('John Doe');
      expect(component.agentUserId).toBe(42);
    });

    it('should set agentName to "Agent" when firstName is missing', () => {
      authSpy.decodeToken.and.returnValue({ sub: '7' });
      const fix2 = TestBed.createComponent(PropertiesComponent);
      fix2.detectChanges();
      expect(fix2.componentInstance.agentName).toBe('Agent');
    });

    it('should handle null token gracefully', () => {
      authSpy.decodeToken.and.returnValue(null);
      const fix2 = TestBed.createComponent(PropertiesComponent);
      fix2.detectChanges();
      expect(fix2.componentInstance.agentName).toBe('Agent');
      expect(fix2.componentInstance.agentUserId).toBe(0);
    });

    it('should open add modal when queryParam action=add', fakeAsync(() => {
      spyOn(component, 'openAdd');
      queryParams$.next({ action: 'add' });
      tick();
      expect(component.openAdd).toHaveBeenCalled();
    }));

    it('should NOT open add modal for other queryParams', fakeAsync(() => {
      spyOn(component, 'openAdd');
      queryParams$.next({ action: 'list' });
      tick();
      expect(component.openAdd).not.toHaveBeenCalled();
    }));
  });

  /* ─── ngOnDestroy ───────────────────────────────────────────────────── */

  describe('ngOnDestroy', () => {
    it('should clear timers and restore body overflow', fakeAsync(() => {
      document.body.style.overflow = 'hidden';
      (component as any).previewShowTimer = setTimeout(() => {}, 5000);
      (component as any).previewHideTimer = setTimeout(() => {}, 5000);
      component.ngOnDestroy();
      tick(5000);
      expect(document.body.style.overflow).toBe('');
    }));

    it('should stop preview slider on destroy', fakeAsync(() => {
      component.previewImages = ['a', 'b'];
      component.startPreviewSlider();
      component.ngOnDestroy();
      tick(3000);
      expect((component as any).previewSliderTimer).toBeNull();
      discardPeriodicTasks();
    }));
  });

  /* ─── goBack ────────────────────────────────────────────────────────── */

  describe('goBack', () => {
    it('should navigate to agent dashboard', () => {
      component.goBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/agent/dashboard']);
    });
  });

  /* ─── loadProperties ────────────────────────────────────────────────── */

  describe('loadProperties', () => {
    it('should load and filter properties by userId', () => {
      const p = makeProperty({ userId: 42, agentId: 0 });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.agentUserId = 42;
      component.loadProperties();
      expect(component.filteredProperties.length).toBe(1);
      expect(component.totalCount).toBe(1);
      expect(component.isLoading).toBeFalse();
    });

    it('should map images correctly from base64', () => {
      const p = makeProperty({
        userId: 42,
        images: [{ base64: 'abc', contentType: 'image/png' }],
      });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.agentUserId = 42;
      component.loadProperties();
      expect(component.filteredProperties[0].imageUrl).toContain('data:image/png;base64,abc');
    });

    it('should set imageUrl to undefined when no images', () => {
      const p = makeProperty({ userId: 42, images: [] });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.agentUserId = 42;
      component.loadProperties();
      expect(component.filteredProperties[0].imageUrl).toBeUndefined();
    });

    it('should set totalCount from response', () => {
      svcSpy.getAgentProperties.and.returnValue(of({ items: [], totalCount: 99 }) as any);
      component.loadProperties();
      expect(component.totalCount).toBe(99);
    });

    it('should handle error gracefully', () => {
      svcSpy.getAgentProperties.and.returnValue(throwError(() => new Error('fail')));
      component.loadProperties();
      expect(component.isLoading).toBeFalse();
    });

    it('should fall back to empty array when response has no items', () => {
      svcSpy.getAgentProperties.and.returnValue(of({ totalCount: 0 }) as any);
      component.loadProperties();
      expect(component.filteredProperties.length).toBe(0);
    });
  });

  /* ─── applyOwnerFilter ──────────────────────────────────────────────── */

  describe('applyOwnerFilter (via loadProperties)', () => {
    beforeEach(() => { component.agentUserId = 42; });

    it('should include property matching userId', () => {
      const p = makeProperty({ userId: 42, agentId: 0 });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.loadProperties();
      expect(component.filteredProperties.length).toBe(1);
    });

    it('should include property matching agentId', () => {
      const p = makeProperty({ userId: 0, agentId: 42 });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.loadProperties();
      expect(component.filteredProperties.length).toBe(1);
    });

    it('should exclude property not matching userId or agentId', () => {
      const p = makeProperty({ userId: 99, agentId: 99 });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.loadProperties();
      expect(component.filteredProperties.length).toBe(0);
    });
  });

  /* ─── onSearch ──────────────────────────────────────────────────────── */

  describe('onSearch', () => {
    const base = {
      location: '', selectedType: '', listingType: '',
      status: '', minPrice: null, maxPrice: null
    };

    it('should skip search for short location string without other filters', fakeAsync(() => {
      spyOn((component as any).searchSubject, 'next');
      component.onSearch({ ...base, location: 'ab' });
      tick(400);
      expect((component as any).searchSubject.next).not.toHaveBeenCalled();
    }));

    it('should emit search subject when location >= 3 chars', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onSearch({ ...base, location: 'abc' });
      tick(400);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    }));

    it('should search when minPrice is set even with short location', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onSearch({ ...base, location: 'ab', minPrice: 1000 });
      tick(400);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    }));

    it('should search with short location when selectedType is set', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onSearch({ ...base, location: 'ab', selectedType: 'Apartment' });
      tick(400);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    }));

    it('should search when maxPrice is set', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onSearch({ ...base, location: '', maxPrice: 5000000 });
      tick(400);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    }));

    it('should search when listingType is set', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onSearch({ ...base, listingType: 'For Sale' });
      tick(400);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    }));

    it('should search when status is set', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onSearch({ ...base, status: 'Active' });
      tick(400);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    }));

    it('should update filteredProperties after successful search', fakeAsync(() => {
      const p = makeProperty({ userId: 42 });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [p], totalCount: 1 }) as any);
      component.agentUserId = 42;
      component.onSearch({ ...base, location: 'Chennai' });
      tick(400);
      expect(component.filteredProperties.length).toBe(1);
    }));

    it('should handle search error gracefully', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(throwError(() => new Error('fail')));
      component.onSearch({ ...base, location: 'Chennai' });
      tick(400);
      expect(component.isLoading).toBeFalse();
    }));
  });

  /* ─── onClearSearch ─────────────────────────────────────────────────── */

  describe('onClearSearch', () => {
    it('should reset filters and reload', () => {
      (component as any).activeFilters = { location: 'x' };
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      component.onClearSearch();
      expect((component as any).activeFilters).toBeNull();
      expect(component.currentPage).toBe(1);
      expect(svcSpy.getAgentProperties).toHaveBeenCalled();
    });
  });

  /* ─── onPageChange ──────────────────────────────────────────────────── */

  describe('onPageChange', () => {
    it('should call loadProperties when no active filters', () => {
      (component as any).activeFilters = null;
      const callsBefore = svcSpy.getAgentProperties.calls.count();
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect(svcSpy.getAgentProperties.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should emit search subject when active filters exist', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      (component as any).activeFilters = {
        location: 'x', selectedType: '', listingType: '',
        status: '', minPrice: null, maxPrice: null,
      };
      component.onPageChange(3);
      tick(400);
      expect(component.currentPage).toBe(3);
    }));
  });

  /* ─── totalPages ────────────────────────────────────────────────────── */

  describe('totalPages', () => {
    it('returns at least 1 when totalCount is 0', () => {
      component.totalCount = 0;
      expect(component.totalPages).toBe(1);
    });

    it('calculates pages correctly', () => {
      component.totalCount = 25;
      component.pageSize   = 10;
      expect(component.totalPages).toBe(3);
    });
  });

  /* ─── totalPropertiesCount ──────────────────────────────────────────── */

  describe('totalPropertiesCount', () => {
    it('returns totalCount', () => {
      component.totalCount = 77;
      expect(component.totalPropertiesCount).toBe(77);
    });
  });

  /* ─── openAdd / openEdit / openDelete / closeModal ──────────────────── */

  describe('openAdd', () => {
    it('should reset form and set modalMode to add', () => {
      component.openAdd();
      expect(component.modalMode).toBe('add');
      expect(component.selectedFiles.length).toBe(0);
      expect(component.imagePreviews.length).toBe(0);
      expect(component.errorMsg).toBe('');
    });
  });

  describe('openEdit', () => {
    it('should copy property to formModel, set mode=edit, and fetch images', () => {
      const p = makeProperty();
      svcSpy.getImages.and.returnValue(of([]) as any);
      component.openEdit(p);
      expect(component.modalMode).toBe('edit');
      expect(component.selectedProperty).toBe(p);
      expect(svcSpy.getImages).toHaveBeenCalledWith(p.id);
    });
  });

  describe('openDelete', () => {
    it('should set selectedProperty and modalMode=delete', () => {
      const p = makeProperty();
      component.openDelete(p);
      expect(component.modalMode).toBe('delete');
      expect(component.selectedProperty).toBe(p);
    });
  });

  describe('closeModal', () => {
    it('should reset all modal state', () => {
      component.modalMode        = 'add';
      component.selectedProperty = makeProperty();
      component.selectedFiles    = [new File(['x'], 'x.jpg')];
      component.imagePreviews    = ['url'];
      component.errorMsg         = 'err';
      component.closeModal();
      expect(component.modalMode).toBeNull();
      expect(component.selectedProperty).toBeNull();
      expect(component.selectedFiles.length).toBe(0);
      expect(component.imagePreviews.length).toBe(0);
      expect(component.errorMsg).toBe('');
    });
  });

  /* ─── emptyForm ─────────────────────────────────────────────────────── */

  describe('emptyForm', () => {
    it('should return a blank form model with statusId=100', () => {
      const f = component.emptyForm();
      expect(f.title).toBe('');
      expect(f.price).toBe(0);
      expect(f.statusId).toBe(100);
    });
  });

  /* ─── fetchExistingImages ───────────────────────────────────────────── */

  describe('fetchExistingImages', () => {
    it('should map images with previewUrl from base64', () => {
      svcSpy.getImages.and.returnValue(
        of([{ id: 1, base64: 'abc', contentType: 'image/jpeg' }]) as any
      );
      component.fetchExistingImages(1);
      expect(component.existingImages[0].previewUrl)
        .toContain('data:image/jpeg;base64,abc');
    });

    it('should set previewUrl to null when no base64', () => {
      svcSpy.getImages.and.returnValue(of([{ id: 2 }]) as any);
      component.fetchExistingImages(1);
      expect(component.existingImages[0].previewUrl).toBeNull();
    });

    it('should handle getImages error and clear isLoadingImages', () => {
      svcSpy.getImages.and.returnValue(throwError(() => new Error('fail')));
      component.fetchExistingImages(1);
      expect(component.isLoadingImages).toBeFalse();
    });
  });

  /* ─── onAddFilesSelected ────────────────────────────────────────────── */

  describe('onAddFilesSelected', () => {
    function makeEvent(files: File[]): any {
      return { target: { files, value: '' } };
    }

    it('should add selected files', () => {
      const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
      component.onAddFilesSelected(makeEvent([file]));
      expect(component.selectedFiles.length).toBe(1);
    });

    it('should reject when total exceeds 10 images', () => {
      component.selectedFiles = Array.from({ length: 10 }, (_, i) =>
        new File(['x'], `${i}.jpg`)
      );
      component.onAddFilesSelected(makeEvent([new File(['y'], 'extra.jpg')]));
      expect(component.errorMsg).toContain('Maximum 10');
    });
  });

  /* ─── removeAddFile ─────────────────────────────────────────────────── */

  describe('removeAddFile', () => {
    it('should remove file and preview at given index', () => {
      component.selectedFiles = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')];
      component.imagePreviews = ['url-a', 'url-b'];
      component.removeAddFile(0);
      expect(component.selectedFiles.length).toBe(1);
      expect(component.imagePreviews[0]).toBe('url-b');
    });
  });

  /* ─── onEditFilesSelected ───────────────────────────────────────────── */

  describe('onEditFilesSelected', () => {
    function makeEvent(files: File[]): any {
      return { target: { files, value: '' } };
    }

    it('should add new files for edit', () => {
      component.existingImages  = [];
      component.newFilesForEdit = [];
      component.onEditFilesSelected(makeEvent([new File(['x'], 'n.jpg')]));
      expect(component.newFilesForEdit.length).toBe(1);
    });

    it('should reject with "already have 10 images" when at max (no remaining)', () => {
      component.existingImages  = Array.from({ length: 10 }, (_, i) => ({ id: i } as any));
      component.newFilesForEdit = [];
      component.onEditFilesSelected(makeEvent([new File(['x'], 'x.jpg')]));
      expect(component.errorMsg).toContain('10 images');
    });

    it('should show remaining count message when some slots left', () => {
      component.existingImages  = Array.from({ length: 8 }, (_, i) => ({ id: i } as any));
      component.newFilesForEdit = [];
      const files = [
        new File(['a'], 'a.jpg'),
        new File(['b'], 'b.jpg'),
        new File(['c'], 'c.jpg'),
      ];
      component.onEditFilesSelected(makeEvent(files));
      // 8 existing + 3 new = 11 > 10; remaining = 2
      expect(component.errorMsg).toContain('2 more image');
    });

    it('should show singular "image" when 1 slot remaining', () => {
      component.existingImages  = Array.from({ length: 9 }, (_, i) => ({ id: i } as any));
      component.newFilesForEdit = [];
      const files = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')];
      component.onEditFilesSelected(makeEvent(files));
      // remaining = 1
      expect(component.errorMsg).toContain('1 more image');
    });
  });

  /* ─── removeEditFile ────────────────────────────────────────────────── */

  describe('removeEditFile', () => {
    it('should remove new file and preview at given index', () => {
      component.newFilesForEdit    = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')];
      component.newPreviewsForEdit = ['p-a', 'p-b'];
      component.removeEditFile(0);
      expect(component.newFilesForEdit.length).toBe(1);
      expect(component.newPreviewsForEdit[0]).toBe('p-b');
    });
  });

  /* ─── deleteExistingImage ───────────────────────────────────────────── */

  describe('deleteExistingImage', () => {
    it('should do nothing when selectedProperty is null', () => {
      component.selectedProperty = null;
      component.deleteExistingImage({ id: 1, previewUrl: null } as any);
      expect(svcSpy.deleteImages).not.toHaveBeenCalled();
    });

    it('should delete image and remove from existingImages list', () => {
      component.selectedProperty = makeProperty();
      component.existingImages   = [
        { id: 1, previewUrl: null } as any,
        { id: 2, previewUrl: null } as any,
      ];
      svcSpy.deleteImages.and.returnValue(of(null) as any);
      component.deleteExistingImage({ id: 1, previewUrl: null } as any);
      expect(component.existingImages.length).toBe(1);
      expect(component.existingImages[0].id).toBe(2);
    });

    it('should handle deleteImages error and clear isDeletingImageId', () => {
      component.selectedProperty = makeProperty();
      component.existingImages   = [{ id: 1, previewUrl: null } as any];
      svcSpy.deleteImages.and.returnValue(throwError(() => new Error('fail')));
      component.deleteExistingImage({ id: 1, previewUrl: null } as any);
      expect(component.isDeletingImageId).toBeNull();
    });
  });

  /* ─── onSubmit – add mode ───────────────────────────────────────────── */

  describe('onSubmit – add mode', () => {
    beforeEach(() => {
      component.modalMode = 'add';
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit(makeForm(false));
      expect(svcSpy.createProperty).not.toHaveBeenCalled();
    });

    it('should create property without images and close modal', fakeAsync(() => {
      component.selectedFiles = [];
      svcSpy.createProperty.and.returnValue(of({ id: 10 }) as any);
      component.onSubmit(makeForm(true));
      tick(200);
      expect(svcSpy.createProperty).toHaveBeenCalled();
      expect(component.modalMode).toBeNull();
      discardPeriodicTasks();
    }));

    it('should create property and upload images', fakeAsync(() => {
      component.selectedFiles = [new File(['x'], 'x.jpg')];
      svcSpy.createProperty.and.returnValue(of({ id: 10 }) as any);
      svcSpy.uploadImages.and.returnValue(of(null) as any);
      component.onSubmit(makeForm(true));
      tick(200);
      expect(svcSpy.uploadImages).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should show partial success when image upload fails after create', fakeAsync(() => {
      component.selectedFiles = [new File(['x'], 'x.jpg')];
      svcSpy.createProperty.and.returnValue(of({ id: 10 }) as any);
      svcSpy.uploadImages.and.returnValue(throwError(() => new Error('fail')));
      spyOn(component, 'showToast');
      component.onSubmit(makeForm(true));
      tick(200);
      expect(component.showToast)
        .toHaveBeenCalledWith('Property created! Image upload failed.');
      discardPeriodicTasks();
    }));

    it('should skip upload when createProperty returns no id', fakeAsync(() => {
      component.selectedFiles = [new File(['x'], 'x.jpg')];
      svcSpy.createProperty.and.returnValue(of({}) as any);
      component.onSubmit(makeForm(true));
      tick(200);
      expect(svcSpy.uploadImages).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should set errorMsg from error.message when createProperty fails', () => {
      svcSpy.createProperty.and.returnValue(
        throwError(() => ({ error: { message: 'Already exists' } }))
      );
      component.onSubmit(makeForm(true));
      expect(component.errorMsg).toBe('Already exists');
    });

    it('should use fallback errorMsg when createProperty error has no message', () => {
      svcSpy.createProperty.and.returnValue(throwError(() => ({ error: {} })));
      component.onSubmit(makeForm(true));
      expect(component.errorMsg).toBe('Failed to create property.');
    });
  });

  /* ─── onSubmit – edit mode ──────────────────────────────────────────── */

  describe('onSubmit – edit mode', () => {
    beforeEach(() => {
      component.modalMode        = 'edit';
      component.selectedProperty = makeProperty();
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
    });

    it('should update property without new images and close modal', fakeAsync(() => {
      component.newFilesForEdit = [];
      svcSpy.updateProperty.and.returnValue(of(null) as any);
      component.onSubmit(makeForm(true));
      tick(200);
      expect(svcSpy.updateProperty).toHaveBeenCalled();
      expect(component.modalMode).toBeNull();
      discardPeriodicTasks();
    }));

    it('should update property and upload new images', fakeAsync(() => {
      component.newFilesForEdit = [new File(['x'], 'x.jpg')];
      svcSpy.updateProperty.and.returnValue(of(null) as any);
      svcSpy.uploadImages.and.returnValue(of(null) as any);
      component.onSubmit(makeForm(true));
      tick(200);
      expect(svcSpy.uploadImages).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should show partial success when edit image upload fails', fakeAsync(() => {
      component.newFilesForEdit = [new File(['x'], 'x.jpg')];
      svcSpy.updateProperty.and.returnValue(of(null) as any);
      svcSpy.uploadImages.and.returnValue(throwError(() => new Error('fail')));
      spyOn(component, 'showToast');
      component.onSubmit(makeForm(true));
      tick(200);
      expect(component.showToast)
        .toHaveBeenCalledWith('Property updated! Image upload failed.');
      discardPeriodicTasks();
    }));

    it('should set errorMsg from error.message when updateProperty fails', () => {
      svcSpy.updateProperty.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );
      component.onSubmit(makeForm(true));
      expect(component.errorMsg).toBe('Update failed');
    });

    it('should use fallback errorMsg when updateProperty error has no message', () => {
      svcSpy.updateProperty.and.returnValue(throwError(() => ({ error: {} })));
      component.onSubmit(makeForm(true));
      expect(component.errorMsg).toBe('Failed to update property.');
    });
  });

  /* ─── confirmDelete ─────────────────────────────────────────────────── */

  describe('confirmDelete', () => {
    it('should do nothing when selectedProperty is null', () => {
      component.selectedProperty = null;
      component.confirmDelete();
      expect(svcSpy.deleteProperty).not.toHaveBeenCalled();
    });

    it('should delete property and show toast', fakeAsync(() => {
      component.selectedProperty = makeProperty();
      svcSpy.deleteProperty.and.returnValue(of(null) as any);
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      spyOn(component, 'showToast');
      component.confirmDelete();
      tick(200);
      expect(component.showToast)
        .toHaveBeenCalledWith('Property deleted successfully!');
      discardPeriodicTasks();
    }));

    it('should set errorMsg from error.message on delete failure', () => {
      component.selectedProperty = makeProperty();
      svcSpy.deleteProperty.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );
      component.confirmDelete();
      expect(component.errorMsg).toBe('Cannot delete');
    });

    it('should use fallback errorMsg when delete error has no message', () => {
      component.selectedProperty = makeProperty();
      svcSpy.deleteProperty.and.returnValue(throwError(() => ({ error: {} })));
      component.confirmDelete();
      expect(component.errorMsg).toBe('Failed to delete property.');
    });
  });

  /* ─── afterSuccess / showToast ──────────────────────────────────────── */

  describe('afterSuccess', () => {
    it('should close modal, reload, and schedule toast', fakeAsync(() => {
      component.modalMode = 'add';
      svcSpy.getAgentProperties.and.returnValue(of(emptyProps) as any);
      spyOn(component, 'showToast');
      component.afterSuccess('Done!');
      tick(200);
      expect(component.modalMode).toBeNull();
      expect(component.showToast).toHaveBeenCalledWith('Done!');
      discardPeriodicTasks();
    }));
  });

  describe('showToast', () => {
    it('should set successMsg and clear it after 4 seconds', fakeAsync(() => {
      component.showToast('Hello!');
      expect(component.successMsg).toBe('Hello!');
      tick(4000);
      expect(component.successMsg).toBe('');
    }));
  });

  /* ─── Lightbox ──────────────────────────────────────────────────────── */

  describe('lightbox', () => {
    it('openLightbox should set images from base64', () => {
      const p = makeProperty({
        images: [{ base64: 'xyz', contentType: 'image/jpeg' }],
      });
      component.openLightbox(p);
      expect(component.lbVisible).toBeTrue();
      expect(component.lbImages[0]).toContain('data:image/jpeg;base64,xyz');
    });

    it('openLightbox falls back to imageUrl when no base64 images', () => {
      const p = makeProperty({ images: [], imageUrl: 'http://img.jpg' });
      component.openLightbox(p);
      expect(component.lbImages[0]).toBe('http://img.jpg');
    });

    it('closeLightbox should reset state and restore overflow', () => {
      component.lbVisible = true;
      component.lbImages  = ['a', 'b'];
      component.closeLightbox();
      expect(component.lbVisible).toBeFalse();
      expect(component.lbImages.length).toBe(0);
      expect(document.body.style.overflow).toBe('');
    });

    it('lbNext should wrap around to first', () => {
      component.lbImages = ['a', 'b', 'c'];
      component.lbIndex  = 2;
      component.lbNext();
      expect(component.lbIndex).toBe(0);
    });

    it('lbPrev should wrap around to last', () => {
      component.lbImages = ['a', 'b', 'c'];
      component.lbIndex  = 0;
      component.lbPrev();
      expect(component.lbIndex).toBe(2);
    });

    it('lbGoTo should set index directly', () => {
      component.lbImages = ['a', 'b', 'c'];
      component.lbGoTo(2);
      expect(component.lbIndex).toBe(2);
    });
  });

  /* ─── onKeydown ─────────────────────────────────────────────────────── */

  describe('onKeydown', () => {
    it('Escape closes preview when previewVisible=true', () => {
      component.previewVisible = true;
      spyOn(component, 'closePreview');
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.closePreview).toHaveBeenCalled();
    });

    it('Escape closes lightbox when preview not visible but lb is', () => {
      component.previewVisible = false;
      component.lbVisible      = true;
      spyOn(component, 'closeLightbox');
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.closeLightbox).toHaveBeenCalled();
    });

    it('ArrowRight advances lightbox index', () => {
      component.lbVisible = true;
      component.lbImages  = ['a', 'b'];
      component.lbIndex   = 0;
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(component.lbIndex).toBe(1);
    });

    it('ArrowLeft decrements lightbox index', () => {
      component.lbVisible = true;
      component.lbImages  = ['a', 'b'];
      component.lbIndex   = 1;
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(component.lbIndex).toBe(0);
    });

    it('arrow keys do nothing when lightbox is not visible', () => {
      component.lbVisible = false;
      component.lbIndex   = 0;
      component.lbImages  = ['a', 'b'];
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(component.lbIndex).toBe(0);
    });
  });

  /* ─── Row hover preview ─────────────────────────────────────────────── */

  describe('row hover preview', () => {
    it('onRowMouseEnter should show preview after 350ms delay', fakeAsync(() => {
      const p = makeProperty({
        images: [{ base64: 'b64', contentType: 'image/png' }],
      });
      component.onRowMouseEnter(p);
      tick(400);
      expect(component.previewVisible).toBeTrue();
      expect(component.previewProperty).toBe(p);
      discardPeriodicTasks();
    }));

    it('onRowMouseEnter falls back to imageUrl when no images', fakeAsync(() => {
      const p = makeProperty({ images: [], imageUrl: 'http://img.jpg' });
      component.onRowMouseEnter(p);
      tick(400);
      expect(component.previewImages[0]).toBe('http://img.jpg');
      discardPeriodicTasks();
    }));

    it('onRowMouseEnter cancels existing hide timer', fakeAsync(() => {
      (component as any).previewHideTimer = setTimeout(() => {}, 5000);
      component.onRowMouseEnter(makeProperty());
      tick(400);
      expect((component as any).previewHideTimer).toBeNull();
      discardPeriodicTasks();
    }));

    it('onRowMouseLeave should hide preview after 200ms delay', fakeAsync(() => {
      component.previewVisible  = true;
      component.previewProperty = makeProperty();
      component.onRowMouseLeave();
      tick(300);
      expect(component.previewVisible).toBeFalse();
    }));

    it('onRowMouseLeave clears show timer if one is pending', fakeAsync(() => {
      (component as any).previewShowTimer = setTimeout(() => {}, 5000);
      component.onRowMouseLeave();
      tick(300);
      expect((component as any).previewShowTimer).toBeNull();
    }));

    it('onPreviewMouseEnter cancels hide timer and stops slider', fakeAsync(() => {
      (component as any).previewHideTimer = setTimeout(() => {}, 5000);
      component.previewImages = ['a', 'b'];
      component.startPreviewSlider();
      component.onPreviewMouseEnter();
      expect((component as any).previewHideTimer).toBeNull();
      expect((component as any).previewSliderTimer).toBeNull();
      discardPeriodicTasks();
    }));

    it('onPreviewMouseLeave restarts slider and sets hide timer', fakeAsync(() => {
      component.previewImages = ['a', 'b'];
      component.onPreviewMouseLeave();
      expect((component as any).previewHideTimer).not.toBeNull();
      tick(200);
      expect(component.previewVisible).toBeFalse();
      discardPeriodicTasks();
    }));

    it('closePreview dismisses preview and clears show timer', fakeAsync(() => {
      (component as any).previewShowTimer = setTimeout(() => {}, 5000);
      component.previewVisible  = true;
      component.previewProperty = makeProperty();
      component.closePreview();
      tick();
      expect(component.previewVisible).toBeFalse();
      expect((component as any).previewShowTimer).toBeNull();
    }));
  });

  /* ─── Preview slider ────────────────────────────────────────────────── */

  describe('preview slider', () => {
    it('previewSlideNext wraps around to first', () => {
      component.previewImages      = ['a', 'b', 'c'];
      component.previewSliderIndex = 2;
      component.previewSlideNext();
      expect(component.previewSliderIndex).toBe(0);
    });

    it('previewSlideNext does nothing when images is empty', () => {
      component.previewImages      = [];
      component.previewSliderIndex = 0;
      component.previewSlideNext();
      expect(component.previewSliderIndex).toBe(0);
    });

    it('previewSlidePrev wraps around to last', () => {
      component.previewImages      = ['a', 'b', 'c'];
      component.previewSliderIndex = 0;
      component.previewSlidePrev();
      expect(component.previewSliderIndex).toBe(2);
    });

    it('previewSlidePrev does nothing when images is empty', () => {
      component.previewImages      = [];
      component.previewSliderIndex = 0;
      component.previewSlidePrev();
      expect(component.previewSliderIndex).toBe(0);
    });

    it('previewGoTo sets index directly', () => {
      component.previewImages = ['a', 'b', 'c'];
      component.previewGoTo(2);
      expect(component.previewSliderIndex).toBe(2);
    });

    it('startPreviewSlider advances index every 3s for multiple images', fakeAsync(() => {
      component.previewImages      = ['a', 'b'];
      component.previewSliderIndex = 0;
      component.startPreviewSlider();
      tick(3000);
      expect(component.previewSliderIndex).toBe(1);
      discardPeriodicTasks();
    }));

    it('startPreviewSlider does NOT set timer for a single image', () => {
      component.previewImages = ['a'];
      component.startPreviewSlider();
      expect((component as any).previewSliderTimer).toBeNull();
    });

    it('stopPreviewSlider clears the interval', fakeAsync(() => {
      component.previewImages = ['a', 'b'];
      component.startPreviewSlider();
      component.stopPreviewSlider();
      expect((component as any).previewSliderTimer).toBeNull();
      discardPeriodicTasks();
    }));

    it('stopPreviewSlider is safe when no timer is set', () => {
      (component as any).previewSliderTimer = null;
      expect(() => component.stopPreviewSlider()).not.toThrow();
    });
  });

  /* ─── formatPrice / getStatusClass / getListingClass ───────────────── */

  describe('formatPrice', () => {
    it('should format number as INR currency string', () => {
      expect(component.formatPrice(5000000)).toContain('50');
    });
  });

  describe('getStatusClass', () => {
    it('returns pill-active for ACTIVE',    () => expect(component.getStatusClass('Active')).toBe('pill-active'));
    it('returns pill-sold for SOLD',        () => expect(component.getStatusClass('SOLD')).toBe('pill-sold'));
    it('returns pill-pending for PENDING',  () => expect(component.getStatusClass('pending')).toBe('pill-pending'));
    it('returns pill-inactive for unknown', () => expect(component.getStatusClass('other')).toBe('pill-inactive'));
    it('handles undefined gracefully',      () => expect(component.getStatusClass(undefined as any)).toBe('pill-inactive'));
  });

  describe('getListingClass', () => {
    it('returns badge-sale for For Sale', () => expect(component.getListingClass('For Sale')).toBe('badge-sale'));
    it('returns badge-rent for For Rent', () => expect(component.getListingClass('For Rent')).toBe('badge-rent'));
    it('returns badge-lease for Lease',   () => expect(component.getListingClass('Lease')).toBe('badge-lease'));
  });

  /* ─── trackById ─────────────────────────────────────────────────────── */

  describe('trackById', () => {
    it('should return the property id', () => {
      expect(component.trackById(0, makeProperty({ id: 99 }))).toBe(99);
    });
  });
});