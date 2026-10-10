import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
  let component: PaginatorComponent;
  let fixture: ComponentFixture<PaginatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaginatorComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(PaginatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have currentPage 1 by default', () => {
    expect(component.currentPage).toBe(1);
  });

  it('should have totalPages 1 by default', () => {
    expect(component.totalPages).toBe(1);
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept a custom currentPage', () => {
    component.currentPage = 3;
    fixture.detectChanges();
    expect(component.currentPage).toBe(3);
  });

  it('should accept a custom totalPages', () => {
    component.totalPages = 10;
    fixture.detectChanges();
    expect(component.totalPages).toBe(10);
  });

  // ── pageChange output ───────────────────────────────────────────────────────

  it('should emit pageChange with the new page number', () => {
    let emittedPage: number | undefined;
    component.pageChange.subscribe((page: number) => (emittedPage = page));
    component.pageChange.emit(2);
    expect(emittedPage).toBe(2);
  });

  it('should emit page 1 correctly', () => {
    let emittedPage: number | undefined;
    component.pageChange.subscribe((page: number) => (emittedPage = page));
    component.pageChange.emit(1);
    expect(emittedPage).toBe(1);
  });

  it('should emit last page correctly', () => {
    component.totalPages = 5;
    let emittedPage: number | undefined;
    component.pageChange.subscribe((page: number) => (emittedPage = page));
    component.pageChange.emit(5);
    expect(emittedPage).toBe(5);
  });

  // ── Combined state ──────────────────────────────────────────────────────────

  it('should reflect currentPage and totalPages together', () => {
    component.currentPage = 4;
    component.totalPages  = 7;
    fixture.detectChanges();
    expect(component.currentPage).toBe(4);
    expect(component.totalPages).toBe(7);
  });
});
