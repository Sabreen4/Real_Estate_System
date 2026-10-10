import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Property, PropertyImage } from 'src/app/core/models/property.model';
import { AgentPropertyService, PaginatedProperties } from 'src/app/core/services/agent-property.service';
import { AuthService } from 'src/app/core/services/auth.service';

import { PROPERTY_TYPES, LISTING_TYPES, STATUSES } from './config/property-dropdowns.config';
import { getStatusClass, getListingClass }  from './config/property-styles.config';
import { emptyPropertyForm, formatPrice } from './config/property-form.config';
import { ExistingImage, IMAGE_UPLOAD_MAX,mapPropertyImages, buildPreviewUrls }from './config/property-image.config';

type ModalMode    = 'add' | 'edit' | 'delete' | null;
type SearchFilters = {
  location:     string;
  selectedType: string;
  listingType:  string;
  status:       string;
  minPrice:     number | null;
  maxPrice:     number | null;
};

@Component({
  selector:    'app-agent-properties',
  standalone:  false,
  templateUrl: './properties.component.html',
  styleUrls:   ['./properties.component.css']
})
export class PropertiesComponent implements OnInit, OnDestroy {

  // ── STATE ──────────────────────────────────────────────────────────────────
  public properties:         Property[] = [];
  public filteredProperties: Property[] = [];
  public isLoading:          boolean    = false;
  public isSubmitting:       boolean    = false;
  public successMsg:         string     = '';
  public errorMsg:           string     = '';

  // ── IMAGES: Hover preview slider ──────────────────────────────────────────
  public previewImages:       string[]  = [];
  public previewSliderIndex:  number    = 0;
  private previewSliderTimer: ReturnType<typeof setInterval> | null = null;

  // ── PAGINATION ─────────────────────────────────────────────────────────────
  public currentPage: number = 1;
  public pageSize:    number = 10;
  public totalCount:  number = 0;

  public get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  // ── MODAL ──────────────────────────────────────────────────────────────────
  public modalMode:        ModalMode      = null;
  public selectedProperty: Property | null = null;

  // ── AGENT ──────────────────────────────────────────────────────────────────
  public agentName:   string = '';
  public agentUserId: number = 0;

  // ── FORM MODEL ─────────────────────────────────────────────────────────────
  public formModel: Partial<Property> = emptyPropertyForm();

  // ── IMAGES: Add modal ─────────────────────────────────────────────────────
  public selectedFiles: File[]   = [];
  public imagePreviews: string[] = [];

  // ── IMAGES: Edit modal ────────────────────────────────────────────────────
  public existingImages:     ExistingImage[] = [];
  public newFilesForEdit:    File[]          = [];
  public newPreviewsForEdit: string[]        = [];
  public isLoadingImages:    boolean         = false;
  public isDeletingImageId:  number | null   = null;

  // ── LIGHTBOX ───────────────────────────────────────────────────────────────
  public lbImages:   string[]        = [];
  public lbVisible:  boolean         = false;
  public lbIndex:    number          = 0;
  public lbProperty: Property | null = null;

  // ── ROW HOVER PREVIEW ─────────────────────────────────────────────────────
  public previewProperty: Property | null = null;
  public previewVisible:  boolean         = false;
  private previewShowTimer: ReturnType<typeof setTimeout> | null = null;
  private previewHideTimer: ReturnType<typeof setTimeout> | null = null;

  // ── DROPDOWNS (from config) ────────────────────────────────────────────────
  public propertyTypes = PROPERTY_TYPES;
  public listingTypes  = LISTING_TYPES;
  public statuses      = STATUSES;

  private activeFilters: SearchFilters | null = null;
  private searchSubject = new Subject<SearchFilters>();
  private destroy$      = new Subject<void>();

  constructor(
    private svc:    AgentPropertyService,
    private auth:   AuthService,
    private router: Router,
    private route:  ActivatedRoute,
    private cdr:    ChangeDetectorRef
  ) {}

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────

  public ngOnInit(): void {
    const decoded    = this.auth.decodeToken();
    this.agentName   = decoded?.firstName
      ? `${decoded.firstName} ${decoded.lastName || ''}`.trim()
      : 'Agent';
    this.agentUserId = decoded?.sub ? +decoded.sub : 0;

    this.loadProperties();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(filters => {
        this.isLoading = true;
        this.cdr.detectChanges();
        return this.svc.getAgentProperties(
          this.agentUserId, filters, this.currentPage, this.pageSize
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: PaginatedProperties) => {
        const raw = res?.items ?? [];
        this.filteredProperties = this.applyOwnerFilter(mapPropertyImages(raw));
        this.totalCount         = res?.totalCount ?? this.filteredProperties.length;
        this.isLoading          = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['action'] === 'add') this.openAdd();
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = '';
    if (this.previewShowTimer) clearTimeout(this.previewShowTimer);
    if (this.previewHideTimer) clearTimeout(this.previewHideTimer);
    this.stopPreviewSlider();
  }

  // ── KEYBOARD ───────────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  public onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.previewVisible) { this.closePreview(); return; }
      if (this.lbVisible)      { this.closeLightbox(); return; }
    }
    if (!this.lbVisible) return;
    if (e.key === 'ArrowRight') this.lbNext();
    if (e.key === 'ArrowLeft')  this.lbPrev();
  }

  // ── NAVIGATION ─────────────────────────────────────────────────────────────

  public goBack(): void {
    this.router.navigate(['/agent/dashboard']);
  }

  // ── LOAD ───────────────────────────────────────────────────────────────────

  public loadProperties(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.svc.getAgentProperties(
      this.agentUserId, this.activeFilters, this.currentPage, this.pageSize
    ).subscribe({
      next: (res: PaginatedProperties) => {
        const raw    = res?.items ?? [];
        const mapped = this.applyOwnerFilter(mapPropertyImages(raw));
        this.properties         = mapped;
        this.filteredProperties = mapped;
        this.totalCount         = res?.totalCount ?? mapped.length;
        this.isLoading          = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── SEARCH ─────────────────────────────────────────────────────────────────

  public onSearch(filters: SearchFilters): void {
    const hasOtherFilters =
      !!filters.selectedType   ||
      !!filters.listingType    ||
      !!filters.status         ||
      filters.minPrice != null ||
      filters.maxPrice != null;

    if (
      !hasOtherFilters &&
      filters.location.trim().length > 0 &&
      filters.location.trim().length < 3
    ) return;

    this.activeFilters = filters;
    this.currentPage   = 1;
    this.searchSubject.next(filters);
  }

  public onClearSearch(): void {
    this.activeFilters = null;
    this.currentPage   = 1;
    this.loadProperties();
  }

  // ── PAGINATION ─────────────────────────────────────────────────────────────

  public onPageChange(page: number): void {
    this.currentPage = page;
    if (this.activeFilters) {
      this.searchSubject.next(this.activeFilters);
    } else {
      this.loadProperties();
    }
  }

  // ── ROW HOVER PREVIEW ─────────────────────────────────────────────────────

  public onRowMouseEnter(p: Property): void {
    if (this.previewHideTimer) {
      clearTimeout(this.previewHideTimer);
      this.previewHideTimer = null;
    }
    this.previewShowTimer = setTimeout(() => {
      this.previewProperty    = p;
      this.previewSliderIndex = 0;
      this.previewImages      = buildPreviewUrls(p);
      this.previewVisible     = true;
      document.body.style.overflow = 'hidden';
      this.startPreviewSlider();
      this.cdr.detectChanges();
    }, 350);
  }

  public previewSlideNext(): void {
    if (!this.previewImages.length) return;
    this.previewSliderIndex =
      (this.previewSliderIndex + 1) % this.previewImages.length;
    this.cdr.detectChanges();
  }

  public previewSlidePrev(): void {
    if (!this.previewImages.length) return;
    this.previewSliderIndex =
      (this.previewSliderIndex - 1 + this.previewImages.length) %
      this.previewImages.length;
    this.cdr.detectChanges();
  }

  public previewGoTo(i: number): void {
    this.previewSliderIndex = i;
    this.cdr.detectChanges();
  }

  public startPreviewSlider(): void {
    this.stopPreviewSlider();
    if (this.previewImages.length > 1) {
      this.previewSliderTimer = setInterval(() => this.previewSlideNext(), 3000);
    }
  }

  public stopPreviewSlider(): void {
    if (this.previewSliderTimer) {
      clearInterval(this.previewSliderTimer);
      this.previewSliderTimer = null;
    }
  }

  public onRowMouseLeave(): void {
    if (this.previewShowTimer) {
      clearTimeout(this.previewShowTimer);
      this.previewShowTimer = null;
    }
    this.previewHideTimer = setTimeout(() => this._dismissPreview(), 200);
  }

  public onPreviewMouseEnter(): void {
    if (this.previewHideTimer) {
      clearTimeout(this.previewHideTimer);
      this.previewHideTimer = null;
    }
    this.stopPreviewSlider();
  }

  public onPreviewMouseLeave(): void {
    this.startPreviewSlider();
    this.previewHideTimer = setTimeout(() => this._dismissPreview(), 150);
  }

  public closePreview(): void {
    if (this.previewShowTimer) {
      clearTimeout(this.previewShowTimer);
      this.previewShowTimer = null;
    }
    this._dismissPreview();
  }

  private _dismissPreview(): void {
    this.stopPreviewSlider();
    this.previewVisible  = false;
    this.previewProperty = null;
    this.previewImages   = [];
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  // ── LIGHTBOX ───────────────────────────────────────────────────────────────

  public openLightbox(p: Property): void {
    this.lbImages   = buildPreviewUrls(p);
    this.lbIndex    = 0;
    this.lbProperty = p;
    this.lbVisible  = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  public closeLightbox(): void {
    this.lbVisible  = false;
    this.lbImages   = [];
    this.lbProperty = null;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  public lbNext(): void {
    this.lbIndex = (this.lbIndex + 1) % this.lbImages.length;
    this.cdr.detectChanges();
  }

  public lbPrev(): void {
    this.lbIndex = (this.lbIndex - 1 + this.lbImages.length) % this.lbImages.length;
    this.cdr.detectChanges();
  }

  public lbGoTo(i: number): void {
    this.lbIndex = i;
    this.cdr.detectChanges();
  }

  // ── MODAL ──────────────────────────────────────────────────────────────────

  public openAdd(): void {
    this.formModel     = emptyPropertyForm();
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.errorMsg      = '';
    this.modalMode     = 'add';
  }

  public openEdit(p: Property): void {
    this.selectedProperty   = p;
    this.formModel          = { ...p };
    this.newFilesForEdit    = [];
    this.newPreviewsForEdit = [];
    this.existingImages     = [];
    this.errorMsg           = '';
    this.modalMode          = 'edit';
    this.fetchExistingImages(p.id);
  }

  public openDelete(p: Property): void {
    this.selectedProperty = p;
    this.errorMsg         = '';
    this.modalMode        = 'delete';
  }

  public closeModal(): void {
    this.modalMode          = null;
    this.selectedProperty   = null;
    this.formModel          = emptyPropertyForm();
    this.selectedFiles      = [];
    this.imagePreviews      = [];
    this.newFilesForEdit    = [];
    this.newPreviewsForEdit = [];
    this.existingImages     = [];
    this.errorMsg           = '';
  }

  // ── IMAGES ─────────────────────────────────────────────────────────────────

  public fetchExistingImages(propertyId: number): void {
    this.isLoadingImages = true;
    this.svc.getImages(propertyId).subscribe({
      next: (imgs: PropertyImage[]) => {
        this.existingImages = imgs.map((img: PropertyImage) => ({
          ...img,
          previewUrl: img.base64
            ? `data:${img.contentType || 'image/jpeg'};base64,${img.base64}`
            : null
        }));
        this.isLoadingImages = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingImages = false;
        this.cdr.detectChanges();
      }
    });
  }

  public onAddFilesSelected(event: Event): void {
    const input       = event.target as HTMLInputElement;
    const files       = Array.from(input.files ?? []);
    const wouldExceed = this.selectedFiles.length + files.length > IMAGE_UPLOAD_MAX;

    if (wouldExceed) {
      this.errorMsg = `Maximum ${IMAGE_UPLOAD_MAX} images allowed per property.`;
      input.value   = '';
      this.cdr.detectChanges();
      return;
    }

    this.selectedFiles = [...this.selectedFiles, ...files];
    this.imagePreviews = [];

    this.selectedFiles.forEach(f => {
      const r    = new FileReader();
      r.onload   = (e: ProgressEvent<FileReader>) => {
        this.imagePreviews.push(e.target?.result as string);
        this.cdr.detectChanges();
      };
      r.readAsDataURL(f);
    });
  }

  public removeAddFile(i: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, idx) => idx !== i);
    this.imagePreviews = this.imagePreviews.filter((_, idx) => idx !== i);
  }

  public onEditFilesSelected(event: Event): void {
    const input        = event.target as HTMLInputElement;
    const files        = Array.from(input.files ?? []);
    const currentTotal = this.existingImages.length + this.newFilesForEdit.length;
    const wouldExceed  = currentTotal + files.length > IMAGE_UPLOAD_MAX;

    if (wouldExceed) {
      const remaining = IMAGE_UPLOAD_MAX - currentTotal;
      this.errorMsg   = remaining <= 0
        ? `You already have ${IMAGE_UPLOAD_MAX} images. Delete some before adding more.`
        : `You can only add ${remaining} more image${remaining === 1 ? '' : 's'} (max ${IMAGE_UPLOAD_MAX}).`;
      input.value     = '';
      this.cdr.detectChanges();
      return;
    }

    this.newFilesForEdit = [...this.newFilesForEdit, ...files];

    files.forEach(f => {
      const r  = new FileReader();
      r.onload = (e: ProgressEvent<FileReader>) => {
        this.newPreviewsForEdit.push(e.target?.result as string);
        this.cdr.detectChanges();
      };
      r.readAsDataURL(f);
    });
  }

  public removeEditFile(i: number): void {
    this.newFilesForEdit    = this.newFilesForEdit.filter((_, idx) => idx !== i);
    this.newPreviewsForEdit = this.newPreviewsForEdit.filter((_, idx) => idx !== i);
  }

  public deleteExistingImage(img: ExistingImage): void {
    if (!this.selectedProperty) return;
    this.isDeletingImageId = img.id;
    this.svc.deleteImages(this.selectedProperty.id, [img.id]).subscribe({
      next: () => {
        this.existingImages    = this.existingImages.filter(i => i.id !== img.id);
        this.isDeletingImageId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDeletingImageId = null;
        this.cdr.detectChanges();
      }
    });
  }

  // ── SUBMIT ─────────────────────────────────────────────────────────────────

  public onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.isSubmitting = true;
    this.errorMsg     = '';

    if (this.modalMode === 'add') {
      this.svc.createProperty({ ...this.formModel }).subscribe({
        next: (res: Property) => {
          const newId = res?.id;
          if (newId && this.selectedFiles.length > 0) {
            this.svc.uploadImages(newId, this.selectedFiles).subscribe({
              next:  () => this.afterSuccess('Property created successfully!'),
              error: () => this.afterSuccess('Property created! Image upload failed.')
            });
          } else {
            this.afterSuccess('Property created successfully!');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg     = err.error?.message || 'Failed to create property.';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }

    if (this.modalMode === 'edit' && this.selectedProperty) {
      this.svc.updateProperty(this.selectedProperty.id, { ...this.formModel }).subscribe({
        next: () => {
          if (this.newFilesForEdit.length > 0 && this.selectedProperty) {
            this.svc.uploadImages(this.selectedProperty.id, this.newFilesForEdit).subscribe({
              next:  () => this.afterSuccess('Property updated successfully!'),
              error: () => this.afterSuccess('Property updated! Image upload failed.')
            });
          } else {
            this.afterSuccess('Property updated successfully!');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg     = err.error?.message || 'Failed to update property.';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  public confirmDelete(): void {
    if (!this.selectedProperty) return;
    this.isSubmitting = true;
    this.svc.deleteProperty(this.selectedProperty.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.showToast('Property deleted successfully!');
        this.invalidateCacheAndReload();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg     = err.error?.message || 'Failed to delete property.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── TOAST / SUCCESS ────────────────────────────────────────────────────────

  public afterSuccess(msg: string): void {
    this.isSubmitting = false;
    this.closeModal();
    this.invalidateCacheAndReload();
    setTimeout(() => this.showToast(msg), 100);
  }

  public showToast(msg: string): void {
    this.successMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  // ── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private invalidateCacheAndReload(): void {
    this.currentPage = 1;
    this.loadProperties();
  }

  private applyOwnerFilter(list: Property[]): Property[] {
    return list.filter((p: Property) =>
      +p.userId          === +this.agentUserId ||
      +(p.agentId ?? 0)  === +this.agentUserId
    );
  }

  // ── PUBLIC HELPERS (template-facing) ──────────────────────────────────────

  public emptyForm(): Partial<Property> { return emptyPropertyForm(); }

  public formatPrice(n: number): string { return formatPrice(n); }

  public getStatusClass(s: string):  string { return getStatusClass(s); }

  public getListingClass(t: string): string { return getListingClass(t); }

  public get totalPropertiesCount(): number { return this.totalCount; }

  public trackById(_: number, p: Property): number { return p.id; }
}