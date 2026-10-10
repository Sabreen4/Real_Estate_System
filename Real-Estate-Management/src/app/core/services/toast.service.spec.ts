import { TestBed } from '@angular/core/testing';
import { ToastService } from 'src/app/core/services/toast.service';
import { ToastrService } from 'ngx-toastr';

describe('ToastService', () => {
    let service: ToastService;
    let toastrSpy: jasmine.SpyObj<ToastrService>;

    beforeEach(() => {
        toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'warning', 'info']);

        TestBed.configureTestingModule({
            providers: [
                ToastService,
                { provide: ToastrService, useValue: toastrSpy }
            ]
        });
        service = TestBed.inject(ToastService);
    });

    // ─── success ─────────────────────────────────────────────────────────────
    describe('success()', () => {
        it('should call toastr.success with message and default title', () => {
            service.success('Saved!');
            expect(toastrSpy.success).toHaveBeenCalledWith('Saved!', 'Success', jasmine.any(Object));
        });

        it('should call toastr.success with custom title', () => {
            service.success('Done', 'Great');
            expect(toastrSpy.success).toHaveBeenCalledWith('Done', 'Great', jasmine.any(Object));
        });

        it('should pass timeOut, progressBar and closeButton options', () => {
            service.success('msg');
            const opts = toastrSpy.success.calls.mostRecent().args[2] as any;
            expect(opts?.timeOut).toBe(3000);
            expect(opts?.progressBar).toBeTrue();
            expect(opts?.closeButton).toBeTrue();
        });
    });

    // ─── error ───────────────────────────────────────────────────────────────
    describe('error()', () => {
        it('should call toastr.error with message and default title', () => {
            service.error('Oops!');
            expect(toastrSpy.error).toHaveBeenCalledWith('Oops!', 'Error', jasmine.any(Object));
        });

        it('should call toastr.error with custom title', () => {
            service.error('Failed', '404');
            expect(toastrSpy.error).toHaveBeenCalledWith('Failed', '404', jasmine.any(Object));
        });

       
        it('should pass timeOut 3000 and progressBar options', () => {
            service.error('err');
            const opts = toastrSpy.error.calls.mostRecent().args[2] as any;
            expect(opts?.timeOut).toBe(3000);
            expect(opts?.progressBar).toBeTrue();
        });
    });

    // ─── warning ─────────────────────────────────────────────────────────────
    describe('warning()', () => {
        it('should call toastr.warning with message and default title', () => {
            service.warning('Heads up!');
            expect(toastrSpy.warning).toHaveBeenCalledWith('Heads up!', 'Warning');
        });

        it('should call toastr.warning with custom title', () => {
            service.warning('Watch out', 'Caution');
            expect(toastrSpy.warning).toHaveBeenCalledWith('Watch out', 'Caution');
        });
    });

    // ─── info ────────────────────────────────────────────────────────────────
    describe('info()', () => {
        it('should call toastr.info with message and default title', () => {
            service.info('FYI');
            expect(toastrSpy.info).toHaveBeenCalledWith('FYI', 'Info');
        });

        it('should call toastr.info with custom title', () => {
            service.info('Note this', 'Note');
            expect(toastrSpy.info).toHaveBeenCalledWith('Note this', 'Note');
        });
    });
});