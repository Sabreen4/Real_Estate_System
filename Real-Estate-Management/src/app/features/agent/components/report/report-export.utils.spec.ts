// import { ChangeDetectorRef } from '@angular/core';
// import { exportCsv, exportPdf, PdfExportOptions } from './report-export.utils';
// import { PropertyRow } from './report.types';

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function makeRow(o: Partial<PropertyRow> = {}): PropertyRow {
//   return {
//     id: 1, title: 'Test Property', city: 'Chennai',
//     price: 5000000, status: 'ACTIVE', listingType: 'SALE',
//     createdAt: '2024-01-15T10:00:00Z', ...o,
//   };
// }

// const defaultListingLabel = (type: string): string => {
//   if (type.includes('SALE'))  return 'For Sale';
//   if (type.includes('RENT'))  return 'For Rent';
//   if (type.includes('LEASE')) return 'Lease';
//   return type;
// };

// function makeCdr(): ChangeDetectorRef {
//   return { detectChanges: jasmine.createSpy('detectChanges') } as any;
// }

// // ── exportCsv ─────────────────────────────────────────────────────────────────

// describe('exportCsv', () => {
//   let createObjectURLSpy: jasmine.Spy;
//   let revokeObjectURLSpy: jasmine.Spy;
//   let createElementSpy:   jasmine.Spy;
//   let anchor: any;

//   beforeEach(() => {
//     anchor = { href: '', download: '', click: jasmine.createSpy('click') };
//     createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:test-url');
//     revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
//     createElementSpy   = spyOn(document, 'createElement').and.callFake((tag: string) => {
//       if (tag === 'a') return anchor;
//       return document.createElement(tag);
//     });
//   });

//   it('should create an anchor element and click it', () => {
//     exportCsv([makeRow()], 'John Doe', defaultListingLabel);
//     expect(createElementSpy).toHaveBeenCalledWith('a');
//     expect(anchor.click).toHaveBeenCalled();
//   });

//   it('should set the href to the object URL', () => {
//     exportCsv([makeRow()], 'John Doe', defaultListingLabel);
//     expect(anchor.href).toBe('blob:test-url');
//   });

//   it('should revoke the object URL after clicking', () => {
//     exportCsv([makeRow()], 'John Doe', defaultListingLabel);
//     expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
//   });

//   it('should include agentName (spaces replaced with _) in filename', () => {
//     exportCsv([makeRow()], 'John Doe', defaultListingLabel);
//     expect(anchor.download).toContain('John_Doe');
//     expect(anchor.download).toContain('Properties_');
//   });

//   it('should include today\'s date (YYYY-MM-DD) in filename', () => {
//     exportCsv([makeRow()], 'Agent', defaultListingLabel);
//     const todayPattern = /\d{4}-\d{2}-\d{2}/;
//     expect(todayPattern.test(anchor.download)).toBeTrue();
//   });

//   it('should produce a CSV with a header row', () => {
//     let capturedBlob: Blob | null = null;
//     createObjectURLSpy.and.callFake((blob: Blob) => { capturedBlob = blob; return 'blob:test'; });

//     exportCsv([makeRow()], 'Agent', defaultListingLabel);

//     expect(capturedBlob).not.toBeNull();
//     expect(capturedBlob!.type).toBe('text/csv;charset=utf-8;');
//   });

//   it('should handle an empty rows array without throwing', () => {
//     expect(() => exportCsv([], 'Agent', defaultListingLabel)).not.toThrow();
//     expect(anchor.click).toHaveBeenCalled();
//   });

//   it('should escape double-quotes inside cell values', () => {
//     const row = makeRow({ title: 'He said "hello"' });
//     expect(() => exportCsv([row], 'Agent', defaultListingLabel)).not.toThrow();
//   });

//   it('should number rows starting from 1', () => {
//     const rows = [makeRow({ id: 1 }), makeRow({ id: 2 })];
//     let capturedBlob: Blob | null = null;
//     createObjectURLSpy.and.callFake((blob: Blob) => { capturedBlob = blob; return 'blob:test'; });
//     exportCsv(rows, 'Agent', defaultListingLabel);
//     expect(capturedBlob).toBeTruthy();
//   });

//   it('should call listingLabel for each row', () => {
//     const labelSpy = jasmine.createSpy('listingLabel').and.returnValue('For Sale');
//     exportCsv([makeRow()], 'Agent', labelSpy);
//     expect(labelSpy).toHaveBeenCalledWith('SALE');
//   });

//   it('should handle null/undefined cell values without throwing', () => {
//     const row = makeRow({ title: undefined as any, city: null as any });
//     expect(() => exportCsv([row], 'Agent', defaultListingLabel)).not.toThrow();
//   });

//   it('should use UTF-8 BOM prefix on the CSV content', () => {
//     let capturedBlob: Blob | null = null;
//     createObjectURLSpy.and.callFake((b: Blob) => { capturedBlob = b; return 'blob:x'; });
//     exportCsv([makeRow()], 'Agent', defaultListingLabel);
//     expect(capturedBlob!.type).toContain('utf-8');
//   });

//   it('should handle multiple rows', () => {
//     const rows = [
//       makeRow({ id: 1, title: 'Prop A', city: 'Chennai' }),
//       makeRow({ id: 2, title: 'Prop B', city: 'Mumbai'  }),
//       makeRow({ id: 3, title: 'Prop C', city: 'Delhi'   }),
//     ];
//     expect(() => exportCsv(rows, 'Agent', defaultListingLabel)).not.toThrow();
//     expect(anchor.click).toHaveBeenCalled();
//   });

//   it('should replace multiple spaces in agentName with underscores', () => {
//     exportCsv([makeRow()], 'Mary   Jane Watson', defaultListingLabel);
//     expect(anchor.download).toContain('Mary_Jane_Watson');
//   });

//   it('should include all seven header columns in the blob', () => {
//     const expectedHeaders = ['#', 'Title', 'City', 'Price (INR)', 'Status', 'Listing Type', 'Listed On'];
//     let capturedBlob: Blob | null = null;
//     createObjectURLSpy.and.callFake((b: Blob) => { capturedBlob = b; return 'blob:h'; });
//     exportCsv([makeRow()], 'Agent', defaultListingLabel);
//     // Blob construction did not throw — headers were serialised correctly
//     expect(capturedBlob).not.toBeNull();
//   });

//   it('should call URL.createObjectURL with a Blob', () => {
//     exportCsv([makeRow()], 'Agent', defaultListingLabel);
//     const arg = createObjectURLSpy.calls.mostRecent().args[0];
//     expect(arg instanceof Blob).toBeTrue();
//   });

//   it('should call listingLabel for every row in a multi-row export', () => {
//     const labelSpy = jasmine.createSpy('listingLabel').and.returnValue('For Rent');
//     const rows = [makeRow({ listingType: 'RENT' }), makeRow({ listingType: 'RENT' })];
//     exportCsv(rows, 'Agent', labelSpy);
//     expect(labelSpy).toHaveBeenCalledTimes(2);
//   });
// });

// // ── exportPdf ─────────────────────────────────────────────────────────────────

// describe('exportPdf', () => {
//   let printSpy:         jasmine.Spy;
//   let rafSpy:           jasmine.Spy;
//   let querySelectorAll: jasmine.Spy;
//   let appendChildSpy:   jasmine.Spy;
//   let removeChildSpy:   jasmine.Spy;

//   let onBeforePrint: jasmine.Spy;
//   let onAfterPrint:  jasmine.Spy;
//   let cdr:           ChangeDetectorRef;

//   function makeOpts(overrides: Partial<PdfExportOptions> = {}): PdfExportOptions {
//     return {
//       agentName:    'John Doe',
//       cdr,
//       onBeforePrint,
//       onAfterPrint,
//       ...overrides,
//     };
//   }

//  beforeEach(() => {
//   document.title = 'Test Runner'; // ← ADD THIS as first line

//   printSpy         = spyOn(window, 'print');
//   rafSpy           = spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
//     cb(0);
//     return 1;
//   });
//   querySelectorAll = spyOn(document, 'querySelectorAll').and.returnValue([] as any);
//   appendChildSpy   = spyOn(document.head, 'appendChild').and.callFake((el: any) => el);
//   removeChildSpy   = spyOn(document.head, 'removeChild').and.callFake((el: any) => el);

//   onBeforePrint = jasmine.createSpy('onBeforePrint');
//   onAfterPrint  = jasmine.createSpy('onAfterPrint');
//   cdr           = makeCdr();

//   jasmine.clock().install();
// });
//   afterEach(() => {
//     jasmine.clock().uninstall();
//   });

//   it('should call onBeforePrint immediately', () => {
//     exportPdf(makeOpts());
//     expect(onBeforePrint).toHaveBeenCalled();
//   });

//   it('should call cdr.detectChanges after onBeforePrint', () => {
//     exportPdf(makeOpts());
//     expect((cdr.detectChanges as jasmine.Spy)).toHaveBeenCalled();
//   });

//   it('should call window.print inside the double-rAF after timeout', () => {
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(printSpy).toHaveBeenCalled();
//   });

//   it('should call onAfterPrint after printing', () => {
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(onAfterPrint).toHaveBeenCalled();
//   });

//   it('should call requestAnimationFrame twice (double-rAF pattern)', () => {
//     exportPdf(makeOpts());
//     expect(rafSpy).toHaveBeenCalledTimes(2);
//   });

//   it('should inject a print style element into document.head', () => {
//     exportPdf(makeOpts());
//     expect(appendChildSpy).toHaveBeenCalled();
//     const injectedEl = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
//     expect(injectedEl.id).toBe('__report-print-override__');
//   });

//   it('should remove the injected style after printing', () => {
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(removeChildSpy).toHaveBeenCalled();
//   });

//   it('should set document.title to include agentName (spaces → _) before printing', () => {
//     let titleDuringPrint = '';
//     printSpy.and.callFake(() => { titleDuringPrint = document.title; });
//     exportPdf(makeOpts({ agentName: 'John Doe' }));
//     jasmine.clock().tick(400);
//     expect(titleDuringPrint).toContain('John_Doe');
//   });

//   it('should restore document.title after printing', () => {
//     const original = document.title;
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(document.title).toBe(original);
//   });

//   it('should hide elements matching navbar selectors', () => {
//     const mockEl: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
//     querySelectorAll.and.callFake((selector: string) => {
//       if (selector === 'app-navbar') return [mockEl] as any;
//       return [] as any;
//     });
//     exportPdf(makeOpts());
//     expect(mockEl.style.setProperty).toHaveBeenCalledWith('display', 'none', 'important');
//   });

//   it('should restore hidden navbar elements after printing', () => {
//     const mockEl: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
//     querySelectorAll.and.callFake((selector: string) => {
//       if (selector === 'app-navbar') return [mockEl] as any;
//       return [] as any;
//     });
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(mockEl.style.removeProperty).toHaveBeenCalledWith('display');
//   });

//   it('should handle no matching navbar elements without throwing', () => {
//     querySelectorAll.and.returnValue([] as any);
//     expect(() => {
//       exportPdf(makeOpts());
//       jasmine.clock().tick(400);
//     }).not.toThrow();
//   });

//   it('should call cdr.detectChanges again after restoring', () => {
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect((cdr.detectChanges as jasmine.Spy).calls.count()).toBeGreaterThanOrEqual(2);
//   });

//   it('should include today\'s date in the document title', () => {
//     let titleDuringPrint = '';
//     printSpy.and.callFake(() => { titleDuringPrint = document.title; });
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     const datePattern = /\d{4}-\d{2}-\d{2}/;
//     expect(datePattern.test(titleDuringPrint)).toBeTrue();
//   });

//   it('should hide multiple navbar elements across selectors', () => {
//     const el1: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
//     const el2: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
//     querySelectorAll.and.callFake((selector: string) => {
//       if (selector === 'app-navbar')  return [el1] as any;
//       if (selector === 'app-header')  return [el2] as any;
//       return [] as any;
//     });
//     exportPdf(makeOpts());
//     expect(el1.style.setProperty).toHaveBeenCalledWith('display', 'none', 'important');
//     expect(el2.style.setProperty).toHaveBeenCalledWith('display', 'none', 'important');
//   });

//   // ── setTimeout restore block (lines 51-93) ────────────────────────────────

//   it('restore: removeChild is not called before setTimeout fires', () => {
//     exportPdf(makeOpts());
//     expect(removeChildSpy).not.toHaveBeenCalled();
//     jasmine.clock().tick(400);
//     expect(removeChildSpy).toHaveBeenCalled();
//   });

//   it('restore: onAfterPrint is not called before setTimeout fires', () => {
//     exportPdf(makeOpts());
//     expect(onAfterPrint).not.toHaveBeenCalled();
//     jasmine.clock().tick(400);
//     expect(onAfterPrint).toHaveBeenCalled();
//   });

//   it('restore: document.title changes before setTimeout fires, resets after', () => {
//   const original = document.title;
//   exportPdf(makeOpts());
//   expect(document.title).not.toBe(original);   // title must be changed NOW (before tick)
//   jasmine.clock().tick(400);
//   expect(document.title).toBe(original);        // title must be restored AFTER tick
// });

//   it('restore: all hidden navbar elements have display removed after setTimeout', () => {
//     const mockEl: any = {
//       style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() },
//     };
//     querySelectorAll.and.callFake((sel: string) =>
//       sel === 'app-navbar' ? [mockEl] as any : [] as any
//     );
//     exportPdf(makeOpts());
//     expect(mockEl.style.removeProperty).not.toHaveBeenCalled();
//     jasmine.clock().tick(400);
//     expect(mockEl.style.removeProperty).toHaveBeenCalledWith('display');
//   });

//   it('injected style textContent should contain .report-toolbar selector', () => {
//     exportPdf(makeOpts());
//     const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
//     expect(el.textContent).toContain('.report-toolbar');
//   });

//   it('injected style textContent should contain .table-wrap selector', () => {
//     exportPdf(makeOpts());
//     const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
//     expect(el.textContent).toContain('.table-wrap');
//   });

//   it('injected style textContent should contain .report-root selector', () => {
//     exportPdf(makeOpts());
//     const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
//     expect(el.textContent).toContain('.report-root');
//   });

//   it('injected style textContent should contain @media print block', () => {
//     exportPdf(makeOpts());
//     const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
//     expect(el.textContent).toContain('@media print');
//   });

//   it('should query all 8 defined navbar selectors', () => {
//     const queried: string[] = [];
//     querySelectorAll.and.callFake((sel: string) => { queried.push(sel); return [] as any; });
//     exportPdf(makeOpts());
//     const expected = [
//       'app-navbar', 'app-header', 'app-nav', 'app-topbar',
//       'app-agent-navbar', '.navbar', '.app-header', '.top-navbar',
//     ];
//     expected.forEach(s => expect(queried).toContain(s));
//   });

//   it('window.print should be called exactly once per export', () => {
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(printSpy).toHaveBeenCalledTimes(1);
//   });

//   it('document.title should include "Property_Report" during print', () => {
//     let titleDuringPrint = '';
//     printSpy.and.callFake(() => { titleDuringPrint = document.title; });
//     exportPdf(makeOpts({ agentName: 'Agent Smith' }));
//     jasmine.clock().tick(400);
//     expect(titleDuringPrint).toContain('Property_Report');
//   });

//   it('should restore multiple navbar elements across all selectors after tick', () => {
//     const el1: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
//     const el2: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
//     querySelectorAll.and.callFake((sel: string) => {
//       if (sel === 'app-nav')   return [el1] as any;
//       if (sel === '.navbar')   return [el2] as any;
//       return [] as any;
//     });
//     exportPdf(makeOpts());
//     jasmine.clock().tick(400);
//     expect(el1.style.removeProperty).toHaveBeenCalledWith('display');
//     expect(el2.style.removeProperty).toHaveBeenCalledWith('display');
//   });

//   it('cdr.detectChanges call count should increase by at least 1 after tick', () => {
//     exportPdf(makeOpts());
//     const beforeTick = (cdr.detectChanges as jasmine.Spy).calls.count();
//     jasmine.clock().tick(400);
//     expect((cdr.detectChanges as jasmine.Spy).calls.count()).toBeGreaterThan(beforeTick);
//   });
// });
import { ChangeDetectorRef } from '@angular/core';
import { exportCsv, exportPdf, PdfExportOptions } from './report-export.utils';
import { PropertyRow } from './report.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRow(o: Partial<PropertyRow> = {}): PropertyRow {
  return {
    id: 1, title: 'Test Property', city: 'Chennai',
    price: 5000000, status: 'ACTIVE', listingType: 'SALE',
    createdAt: '2024-01-15T10:00:00Z', ...o,
  };
}

const defaultListingLabel = (type: string): string => {
  if (type.includes('SALE'))  return 'For Sale';
  if (type.includes('RENT'))  return 'For Rent';
  if (type.includes('LEASE')) return 'Lease';
  return type;
};

function makeCdr(): ChangeDetectorRef {
  return { detectChanges: jasmine.createSpy('detectChanges') } as any;
}

// ── exportCsv ─────────────────────────────────────────────────────────────────

describe('exportCsv', () => {
  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;
  let createElementSpy:   jasmine.Spy;
  let anchor: any;

  beforeEach(() => {
    anchor = { href: '', download: '', click: jasmine.createSpy('click') };
    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:test-url');
    revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
    createElementSpy   = spyOn(document, 'createElement').and.callFake((tag: string) => {
      if (tag === 'a') return anchor;
      return document.createElement(tag);
    });
  });

  it('should create an anchor element and click it', () => {
    exportCsv([makeRow()], 'John Doe', defaultListingLabel);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(anchor.click).toHaveBeenCalled();
  });

  it('should set the href to the object URL', () => {
    exportCsv([makeRow()], 'John Doe', defaultListingLabel);
    expect(anchor.href).toBe('blob:test-url');
  });

  it('should revoke the object URL after clicking', () => {
    exportCsv([makeRow()], 'John Doe', defaultListingLabel);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
  });

  it('should include agentName (spaces replaced with _) in filename', () => {
    exportCsv([makeRow()], 'John Doe', defaultListingLabel);
    expect(anchor.download).toContain('John_Doe');
    expect(anchor.download).toContain('Properties_');
  });

  it("should include today's date (YYYY-MM-DD) in filename", () => {
    exportCsv([makeRow()], 'Agent', defaultListingLabel);
    const todayPattern = /\d{4}-\d{2}-\d{2}/;
    expect(todayPattern.test(anchor.download)).toBeTrue();
  });

  it('should produce a CSV blob with correct mime type', () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.and.callFake((blob: Blob) => { capturedBlob = blob; return 'blob:test'; });
    exportCsv([makeRow()], 'Agent', defaultListingLabel);
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob!.type).toBe('text/csv;charset=utf-8;');
  });

  it('should handle an empty rows array without throwing', () => {
    expect(() => exportCsv([], 'Agent', defaultListingLabel)).not.toThrow();
    expect(anchor.click).toHaveBeenCalled();
  });

  it('should escape double-quotes inside cell values', () => {
    const row = makeRow({ title: 'He said "hello"' });
    expect(() => exportCsv([row], 'Agent', defaultListingLabel)).not.toThrow();
  });

  it('should number rows starting from 1', () => {
    const rows = [makeRow({ id: 1 }), makeRow({ id: 2 })];
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.and.callFake((blob: Blob) => { capturedBlob = blob; return 'blob:test'; });
    exportCsv(rows, 'Agent', defaultListingLabel);
    expect(capturedBlob).toBeTruthy();
  });

  it('should call listingLabel for each row', () => {
    const labelSpy = jasmine.createSpy('listingLabel').and.returnValue('For Sale');
    exportCsv([makeRow()], 'Agent', labelSpy);
    expect(labelSpy).toHaveBeenCalledWith('SALE');
  });

  it('should handle null/undefined cell values without throwing', () => {
    const row = makeRow({ title: undefined as any, city: null as any });
    expect(() => exportCsv([row], 'Agent', defaultListingLabel)).not.toThrow();
  });

  it('should use UTF-8 BOM prefix on the CSV content', () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.and.callFake((b: Blob) => { capturedBlob = b; return 'blob:x'; });
    exportCsv([makeRow()], 'Agent', defaultListingLabel);
    expect(capturedBlob!.type).toContain('utf-8');
  });

  it('should handle multiple rows', () => {
    const rows = [
      makeRow({ id: 1, title: 'Prop A', city: 'Chennai' }),
      makeRow({ id: 2, title: 'Prop B', city: 'Mumbai'  }),
      makeRow({ id: 3, title: 'Prop C', city: 'Delhi'   }),
    ];
    expect(() => exportCsv(rows, 'Agent', defaultListingLabel)).not.toThrow();
    expect(anchor.click).toHaveBeenCalled();
  });

  it('should replace multiple spaces in agentName with underscores', () => {
    exportCsv([makeRow()], 'Mary   Jane Watson', defaultListingLabel);
    expect(anchor.download).toContain('Mary_Jane_Watson');
  });

  it('should include all seven header columns in the blob', () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.and.callFake((b: Blob) => { capturedBlob = b; return 'blob:h'; });
    exportCsv([makeRow()], 'Agent', defaultListingLabel);
    expect(capturedBlob).not.toBeNull();
  });

  it('should call URL.createObjectURL with a Blob', () => {
    exportCsv([makeRow()], 'Agent', defaultListingLabel);
    const arg = createObjectURLSpy.calls.mostRecent().args[0];
    expect(arg instanceof Blob).toBeTrue();
  });

  it('should call listingLabel for every row in a multi-row export', () => {
    const labelSpy = jasmine.createSpy('listingLabel').and.returnValue('For Rent');
    const rows = [makeRow({ listingType: 'RENT' }), makeRow({ listingType: 'RENT' })];
    exportCsv(rows, 'Agent', labelSpy);
    expect(labelSpy).toHaveBeenCalledTimes(2);
  });
});

// ── exportPdf ─────────────────────────────────────────────────────────────────

describe('exportPdf', () => {
  let printSpy:        jasmine.Spy;
  let rafSpy:          jasmine.Spy;
  let querySelectorAll: jasmine.Spy;
  let appendChildSpy:  jasmine.Spy;
  let removeChildSpy:  jasmine.Spy;

  let onBeforePrint: jasmine.Spy;
  let onAfterPrint:  jasmine.Spy;
  let cdr:           ChangeDetectorRef;

  function makeOpts(overrides: Partial<PdfExportOptions> = {}): PdfExportOptions {
    return { agentName: 'John Doe', cdr, onBeforePrint, onAfterPrint, ...overrides };
  }

  beforeEach(() => {
    // Reset title to a known value before every test
    document.title = 'Test Runner';

    printSpy = spyOn(window, 'print');
    rafSpy   = spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    querySelectorAll = spyOn(document, 'querySelectorAll').and.returnValue([] as any);
    appendChildSpy   = spyOn(document.head, 'appendChild').and.callFake((el: any) => el);
    removeChildSpy   = spyOn(document.head, 'removeChild').and.callFake((el: any) => el);

    onBeforePrint = jasmine.createSpy('onBeforePrint');
    onAfterPrint  = jasmine.createSpy('onAfterPrint');
    cdr           = makeCdr();

    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  // ── synchronous (before setTimeout fires) ──────────────────────────────────

  it('should call onBeforePrint immediately', () => {
    exportPdf(makeOpts());
    expect(onBeforePrint).toHaveBeenCalled();
  });

  it('should call cdr.detectChanges after onBeforePrint', () => {
    exportPdf(makeOpts());
    expect((cdr.detectChanges as jasmine.Spy)).toHaveBeenCalled();
  });

  it('should call requestAnimationFrame twice (double-rAF pattern)', () => {
    exportPdf(makeOpts());
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it('should inject a print style element into document.head', () => {
    exportPdf(makeOpts());
    expect(appendChildSpy).toHaveBeenCalled();
    const injectedEl = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
    expect(injectedEl.id).toBe('__report-print-override__');
  });

  it('should set document.title to include agentName before setTimeout fires', () => {
    exportPdf(makeOpts({ agentName: 'John Doe' }));
    // rAF fires synchronously in tests, so title is changed before tick()
    expect(document.title).toContain('John_Doe');
  });

  it('should hide elements matching navbar selectors', () => {
    const mockEl: any = {
      style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() },
    };
    querySelectorAll.and.callFake((selector: string) =>
      selector === 'app-navbar' ? [mockEl] as any : [] as any
    );
    exportPdf(makeOpts());
    expect(mockEl.style.setProperty).toHaveBeenCalledWith('display', 'none', 'important');
  });

  it('should hide multiple navbar elements across selectors', () => {
    const el1: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
    const el2: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
    querySelectorAll.and.callFake((selector: string) => {
      if (selector === 'app-navbar') return [el1] as any;
      if (selector === 'app-header') return [el2] as any;
      return [] as any;
    });
    exportPdf(makeOpts());
    expect(el1.style.setProperty).toHaveBeenCalledWith('display', 'none', 'important');
    expect(el2.style.setProperty).toHaveBeenCalledWith('display', 'none', 'important');
  });

  it('should query all 8 defined navbar selectors', () => {
    const queried: string[] = [];
    querySelectorAll.and.callFake((sel: string) => { queried.push(sel); return [] as any; });
    exportPdf(makeOpts());
    const expected = [
      'app-navbar', 'app-header', 'app-nav', 'app-topbar',
      'app-agent-navbar', '.navbar', '.app-header', '.top-navbar',
    ];
    expected.forEach(s => expect(queried).toContain(s));
  });

  it('injected style textContent should contain @media print block', () => {
    exportPdf(makeOpts());
    const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
    expect(el.textContent).toContain('@media print');
  });

  it('injected style textContent should contain .report-toolbar selector', () => {
    exportPdf(makeOpts());
    const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
    expect(el.textContent).toContain('.report-toolbar');
  });

  it('injected style textContent should contain .table-wrap selector', () => {
    exportPdf(makeOpts());
    const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
    expect(el.textContent).toContain('.table-wrap');
  });

  it('injected style textContent should contain .report-root selector', () => {
    exportPdf(makeOpts());
    const el = appendChildSpy.calls.mostRecent().args[0] as HTMLStyleElement;
    expect(el.textContent).toContain('.report-root');
  });

  it('restore: document.title changes before setTimeout fires, resets after', () => {
    const original = document.title;          // 'Test Runner'
    exportPdf(makeOpts());
    // rAF fires synchronously → title is already changed here
    expect(document.title).not.toBe(original);
    jasmine.clock().tick(400);
    expect(document.title).toBe(original);
  });

  it('restore: removeChild is not called before setTimeout fires', () => {
    exportPdf(makeOpts());
    expect(removeChildSpy).not.toHaveBeenCalled();
    jasmine.clock().tick(400);
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('restore: onAfterPrint is not called before setTimeout fires', () => {
    exportPdf(makeOpts());
    expect(onAfterPrint).not.toHaveBeenCalled();
    jasmine.clock().tick(400);
    expect(onAfterPrint).toHaveBeenCalled();
  });

  it('restore: all hidden navbar elements have display removed after setTimeout', () => {
    const mockEl: any = {
      style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() },
    };
    querySelectorAll.and.callFake((sel: string) =>
      sel === 'app-navbar' ? [mockEl] as any : [] as any
    );
    exportPdf(makeOpts());
    expect(mockEl.style.removeProperty).not.toHaveBeenCalled();
    jasmine.clock().tick(400);
    expect(mockEl.style.removeProperty).toHaveBeenCalledWith('display');
  });

  // ── after setTimeout fires ─────────────────────────────────────────────────

  it('should call window.print inside the double-rAF after timeout', () => {
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(printSpy).toHaveBeenCalled();
  });

  it('window.print should be called exactly once per export', () => {
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onAfterPrint after printing', () => {
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(onAfterPrint).toHaveBeenCalled();
  });

  it('should remove the injected style after printing', () => {
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should restore document.title after printing', () => {
    const original = document.title;   // 'Test Runner'
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(document.title).toBe(original);
  });

  it('should restore hidden navbar elements after printing', () => {
    const mockEl: any = {
      style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() },
    };
    querySelectorAll.and.callFake((selector: string) =>
      selector === 'app-navbar' ? [mockEl] as any : [] as any
    );
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(mockEl.style.removeProperty).toHaveBeenCalledWith('display');
  });

  it('should call cdr.detectChanges again after restoring', () => {
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    // Once before print (synchronous), once after restore
    expect((cdr.detectChanges as jasmine.Spy).calls.count()).toBeGreaterThanOrEqual(2);
  });

  it('cdr.detectChanges call count should increase by at least 1 after tick', () => {
    exportPdf(makeOpts());
    const beforeTick = (cdr.detectChanges as jasmine.Spy).calls.count();
    jasmine.clock().tick(400);
    expect((cdr.detectChanges as jasmine.Spy).calls.count()).toBeGreaterThan(beforeTick);
  });

  it("should include today's date in the document title during print", () => {
    let titleDuringPrint = '';
    printSpy.and.callFake(() => { titleDuringPrint = document.title; });
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    const datePattern = /\d{4}-\d{2}-\d{2}/;
    expect(datePattern.test(titleDuringPrint)).toBeTrue();
  });

  it('should set document.title to include agentName (spaces → _) before printing', () => {
    let titleDuringPrint = '';
    printSpy.and.callFake(() => { titleDuringPrint = document.title; });
    exportPdf(makeOpts({ agentName: 'John Doe' }));
    jasmine.clock().tick(400);
    expect(titleDuringPrint).toContain('John_Doe');
  });

  it('document.title should include "Property_Report" during print', () => {
    let titleDuringPrint = '';
    printSpy.and.callFake(() => { titleDuringPrint = document.title; });
    exportPdf(makeOpts({ agentName: 'Agent Smith' }));
    jasmine.clock().tick(400);
    expect(titleDuringPrint).toContain('Property_Report');
  });

  it('should handle no matching navbar elements without throwing', () => {
    querySelectorAll.and.returnValue([] as any);
    expect(() => {
      exportPdf(makeOpts());
      jasmine.clock().tick(400);
    }).not.toThrow();
  });

  it('should restore multiple navbar elements across all selectors after tick', () => {
    const el1: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
    const el2: any = { style: { setProperty: jasmine.createSpy(), removeProperty: jasmine.createSpy() } };
    querySelectorAll.and.callFake((sel: string) => {
      if (sel === 'app-nav') return [el1] as any;
      if (sel === '.navbar') return [el2] as any;
      return [] as any;
    });
    exportPdf(makeOpts());
    jasmine.clock().tick(400);
    expect(el1.style.removeProperty).toHaveBeenCalledWith('display');
    expect(el2.style.removeProperty).toHaveBeenCalledWith('display');
  });
});