import { ChangeDetectorRef } from '@angular/core';
import { PropertyRow } from './report.types';

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportCsv(
  rows:         PropertyRow[],
  agentName:    string,
  listingLabel: (type: string) => string,
): void {
  const headers = ['#', 'Title', 'City', 'Price (INR)', 'Status', 'Listing Type', 'Listed On'];
  const data    = rows.map((r, i) => [
    i + 1, r.title, r.city, r.price,
    r.status, listingLabel(r.listingType), r.createdAt,
  ]);

  const csv = [headers, ...data]
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${agentName.replace(/\s+/g, '_')}_Properties_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF Export (print-based) ──────────────────────────────────────────────────

export interface PdfExportOptions {
  agentName:    string;
  cdr:          ChangeDetectorRef;
  onBeforePrint: () => void;
  onAfterPrint:  () => void;
}

export function exportPdf(opts: PdfExportOptions): void {
  const { agentName, cdr, onBeforePrint, onAfterPrint } = opts;

  onBeforePrint();
  cdr.detectChanges();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {

      // ── Hide global navbar ─────────────────────────────────────────────
      const navbarSelectors = [
        'app-navbar', 'app-header', 'app-nav', 'app-topbar',
        'app-agent-navbar', '.navbar', '.app-header', '.top-navbar',
      ];
      const hiddenNavbars: HTMLElement[] = [];
      navbarSelectors.forEach(sel => {
        document.querySelectorAll<HTMLElement>(sel).forEach(el => {
          el.style.setProperty('display', 'none', 'important');
          hiddenNavbars.push(el);
        });
      });

      // ── Inject print overrides ─────────────────────────────────────────
      const printStyle       = document.createElement('style');
      printStyle.id          = '__report-print-override__';
      printStyle.textContent = PRINT_OVERRIDE_CSS;
      document.head.appendChild(printStyle);

      // ── Set filename via document title ────────────────────────────────
      const prevTitle = document.title;
      document.title  = `${agentName.replace(/\s+/g, '_')}_Property_Report_${
        new Date().toISOString().slice(0, 10)
      }`;

      // ── Restore helper ─────────────────────────────────────────────────
      const doRestore = () => {
        document.title = prevTitle;
        document.head.removeChild(printStyle);
        hiddenNavbars.forEach(el => el.style.removeProperty('display'));
        onAfterPrint();
        cdr.detectChanges();
      };

      // ── Print then restore synchronously inside the same setTimeout ────
      // This makes jasmine.clock().tick(300+) enough to trigger the full
      // restore path in tests, while still giving Angular a 300 ms flush
      // in the real browser before the print dialog opens.
      setTimeout(() => {
        window.print();
        doRestore();
      }, 300);
    });
  });
}

// ── Scoped print CSS ──────────────────────────────────────────────────────────

const PRINT_OVERRIDE_CSS = `
  @media print {
    .report-toolbar {
      position: static !important;
      top: auto !important;
      z-index: auto !important;
      box-shadow: none !important;
      display: flex !important;
      will-change: auto !important;
      transform: none !important;
    }
    app-back-button { display: none !important; }
    .toolbar-left-group {
      display: flex !important;
      align-items: center !important;
      gap: 0 !important;
    }
    .table-wrap {
      overflow: visible !important;
      overflow-x: visible !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      position: static !important;
      transform: none !important;
      contain: none !important;
      isolation: auto !important;
      clip-path: none !important;
      height: auto !important;
      max-height: none !important;
    }
    .report-root {
      margin-top: 0 !important;
      padding-top: 0 !important;
      position: static !important;
    }
  }
`;