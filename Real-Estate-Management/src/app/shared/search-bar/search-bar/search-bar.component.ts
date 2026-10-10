import {
  Component, EventEmitter, Input, Output,
  HostListener, OnDestroy
} from '@angular/core';

export interface SearchFilters {
  location:     string;
  selectedType: string;
  listingType:  string;
  status:       string;
  minPrice:     number | null;
  maxPrice:     number | null;
}

@Component({
  selector: 'app-searchbar',
  standalone: false,
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
  host: { style: 'width: 100%; display: block;' }
})
export class SearchBarComponent implements OnDestroy {

  @Input() location:     string        = '';
  @Input() selectedType: string        = '';
  @Input() listingType:  string        = '';
  @Input() status:       string        = '';
  @Input() hideStatus:   boolean       = false;
  @Input() minPrice:     number | null = null;
  @Input() maxPrice:     number | null = null;
  @Input() resultCount = 0;

  propertyTypes = [
    { id: '40', label: 'Apartment' },
    { id: '50', label: 'House' },
    { id: '60', label: 'Commercial' }
  ];

  listingTypes = [
    { id: '70', label: 'Sale' },
    { id: '80', label: 'Rent' },
    { id: '90', label: 'Lease' }
  ];

  statuses = [
    { id: '100', label: 'Active' },
    { id: '300', label: 'Sold'   }
  ];

  openDropdown: 'type' | 'listing' | 'status' | null = null;

  @Output() search = new EventEmitter<SearchFilters>();
  @Output() clear  = new EventEmitter<void>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      !target.closest('.custom-select-trigger') &&
      !target.closest('.custom-floating-menu')
    ) {
      this.openDropdown = null;
      this.removeFloatingMenu();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.openDropdown = null;
    this.removeFloatingMenu();
  }

  toggleDropdown(name: 'type' | 'listing' | 'status', event: MouseEvent) {
    event.stopPropagation();

    // Always remove all existing menus first
    this.removeFloatingMenu();

    // If same dropdown clicked — just close
    if (this.openDropdown === name) {
      this.openDropdown = null;
      return;
    }

    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    this.openDropdown = name;

    let options: { id: string; label: string }[] = [];
    let allLabel = '';
    let field: 'selectedType' | 'listingType' | 'status' = 'selectedType';
    let currentValue = '';

    if (name === 'type') {
      options = this.propertyTypes;
      allLabel = 'All Property Types';
      field = 'selectedType';
      currentValue = this.selectedType;
    } else if (name === 'listing') {
      options = this.listingTypes;
      allLabel = 'All Listing Types';
      field = 'listingType';
      currentValue = this.listingType;
    } else {
      options = this.statuses;
      allLabel = 'All Status';
      field = 'status';
      currentValue = this.status;
    }

    const menu = document.createElement('div');
    menu.className = 'custom-floating-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 6}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      overflow: hidden;
      z-index: 999999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      font-family: 'Inter', sans-serif;
    `;

    // "All" option
    const allOpt = document.createElement('div');
    allOpt.style.cssText = `
      font-size: 0.84rem;
      font-weight: 400;
      font-style: italic;
      color: rgba(255,255,255,0.6);
      padding: 11px 16px;
      cursor: pointer;
    `;
    allOpt.textContent = allLabel;
    allOpt.addEventListener('mouseenter', () => {
      allOpt.style.background = 'rgba(255,255,255,0.06)';
      allOpt.style.color = 'rgba(255,255,255,0.9)';
    });
    allOpt.addEventListener('mouseleave', () => {
      allOpt.style.background = 'transparent';
      allOpt.style.color = 'rgba(255,255,255,0.6)';
    });
    allOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectOption(field, '');
      this.removeFloatingMenu();
    });
    menu.appendChild(allOpt);

    // Regular options
    options.forEach(opt => {
      const isSelected = currentValue === opt.id;
      const div = document.createElement('div');
      div.style.cssText = `
        font-size: 0.84rem;
        font-weight: ${isSelected ? '600' : '500'};
        color: ${isSelected ? '#fff' : '#f1f5f9'};
        padding: 11px 16px 11px 36px;
        cursor: pointer;
        position: relative;
      `;
      div.textContent = opt.label;

      if (isSelected) {
        const check = document.createElement('span');
        check.textContent = '✓';
        check.style.cssText = `
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.78rem;
          color: rgba(255,255,255,0.7);
        `;
        div.insertBefore(check, div.firstChild);
      }

      div.addEventListener('mouseenter', () => {
        div.style.background = 'rgba(255,255,255,0.08)';
        div.style.color = '#fff';
      });
      div.addEventListener('mouseleave', () => {
        div.style.background = 'transparent';
        div.style.color = isSelected ? '#fff' : '#f1f5f9';
      });
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectOption(field, opt.id);
        this.removeFloatingMenu();
      });
      menu.appendChild(div);
    });

    document.body.appendChild(menu);
  }

  removeFloatingMenu() {
    document.querySelectorAll('.custom-floating-menu').forEach(el => el.remove());
  }

  selectOption(field: 'selectedType' | 'listingType' | 'status', value: string) {
    this[field] = value;
    this.openDropdown = null;
    this.emitSearch();
  }

  getLabel(options: { id: string; label: string }[], value: string, allLabel: string): string {
    const found = options.find(o => o.id === value);
    return found ? found.label : allLabel;
  }

  public emitSearch(): void {
    this.search.emit({
      location:     this.location,
      selectedType: this.selectedType,
      listingType:  this.listingType,
      status:       this.status,
      minPrice:     this.minPrice,
      maxPrice:     this.maxPrice
    });
  }

  public clearFilters(): void {
    this.location     = '';
    this.selectedType = '';
    this.listingType  = '';
    this.status       = '';
    this.minPrice     = null;
    this.maxPrice     = null;
    this.openDropdown = null;
    this.removeFloatingMenu();
    this.clear.emit();
  }

  ngOnDestroy() {
    this.removeFloatingMenu();
  }
}