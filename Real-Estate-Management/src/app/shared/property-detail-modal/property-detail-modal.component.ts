import {
  Component, Input, Output, EventEmitter,
  OnChanges, OnDestroy, SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { Property, PropertyImage } from '../../core/models/property.model';

@Component({
  selector:    'app-property-detail-modal',
  standalone:  false,
  templateUrl: './property-detail-modal.component.html',
  styleUrls:   ['./property-detail-modal.component.css']
})
export class PropertyDetailModalComponent implements OnChanges, OnDestroy {

  @Input()  property: Property | null = null;
  @Input()  visible:  boolean         = false;
  @Output() closed = new EventEmitter<void>();

  // ── CAROUSEL ───────────────────────────────────────────────────────────────
  public images:      string[]                          = [];
  public activeIndex: number                            = 0;
  private autoTimer:  ReturnType<typeof setInterval> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['property']) {
      if (this.visible && this.property) {
        this.buildImages();
        this.activeIndex = 0;
        this.startAuto();
        document.body.style.overflow = 'hidden';
      } else {
        this.stopAuto();
        document.body.style.overflow = '';
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAuto();
    document.body.style.overflow = '';
  }

  // ── BUILD IMAGE LIST ───────────────────────────────────────────────────────

  private buildImages(): void {
    if (!this.property) { this.images = []; return; }

    const imgs: string[] = (this.property.images ?? [])
      .filter((img: PropertyImage) => img?.base64)
      .map((img: PropertyImage) =>
        `data:${img.contentType || 'image/jpeg'};base64,${img.base64}`
      );

    if (imgs.length === 0 && this.property.imageUrl) {
      imgs.push(this.property.imageUrl);
    }

    this.images = imgs;
  }

  // ── AUTO-SLIDE ─────────────────────────────────────────────────────────────

  private startAuto(): void {
    this.stopAuto();
    if (this.images.length > 1) {
      this.autoTimer = setInterval(() => {
        this.activeIndex = (this.activeIndex + 1) % this.images.length;
        this.cdr.detectChanges();
      }, 2000);
    }
  }

  private stopAuto(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  // ── MANUAL NAV ─────────────────────────────────────────────────────────────

  public goTo(i: number): void {
    this.activeIndex = i;
    this.startAuto();
  }

  public prev(): void {
    this.goTo((this.activeIndex - 1 + this.images.length) % this.images.length);
  }

  public next(): void {
    this.goTo((this.activeIndex + 1) % this.images.length);
  }

  // ── CLOSE ──────────────────────────────────────────────────────────────────

  public close(): void {
    this.stopAuto();
    document.body.style.overflow = '';
    this.closed.emit();
  }

  public onBackdropClick(): void {
    this.close();
  }
}