import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, HostListener
} from '@angular/core';

@Component({
  selector: 'app-image-lightbox',
  standalone: false,
  templateUrl: './image-lightbox.component.html',
  styleUrls: ['./image-lightbox.component.css']
})
export class ImageLightboxComponent implements OnChanges {

  @Input()  images:  string[] = [];   // array of base64/url strings
  @Input()  visible: boolean  = false;
  @Input()  startIndex: number = 0;
  @Output() closed = new EventEmitter<void>();

  public currentIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.currentIndex = this.startIndex ?? 0;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.visible) return;
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft')  this.prev();
    if (e.key === 'Escape')     this.close();
  }

  public next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  public prev(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  public close(): void {
    this.closed.emit();
  }

  public goTo(i: number): void {
    this.currentIndex = i;
  }
}