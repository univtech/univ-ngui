import { ErrorHandler, Injector, VERSION } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowToken } from 'app/shared/window';
import { AppModule } from 'app/app.module';

import { ReportingErrorHandler } from './reporting-error-handler';

describe('ReportingErrorHandler service', () => {
  let handler: ReportingErrorHandler;
  let superHandler: jasmine.Spy;
  let onerrorSpy: jasmine.Spy;

  beforeEach(() => {
    onerrorSpy = jasmine.createSpy('onerror');
    superHandler = spyOn(ErrorHandler.prototype, 'handleError');

    const injector = Injector.create({providers: [
      { provide: ErrorHandler, useClass: ReportingErrorHandler, deps: [WindowToken] },
      { provide: WindowToken, useFactory: () => ({ onerror: onerrorSpy }), deps: [] }
    ]});

    handler = injector.get(ErrorHandler) as unknown as ReportingErrorHandler;
  });

  it('should be registered on the AppModule', () => {
    handler = TestBed.configureTestingModule({ imports: [AppModule] }).inject(ErrorHandler) as any;
    expect(handler).toEqual(jasmine.any(ReportingErrorHandler));
  });

  describe('handleError', () => {
    it('should call the super class handleError', () => {
      const error = new Error();
      handler.handleError(error);
      expect(superHandler).toHaveBeenCalledWith(error);
    });

    it('should cope with the super handler throwing an error', () => {
      const error = new Error('initial error');
      superHandler.and.throwError('super handler error');
      handler.handleError(error);

      expect(onerrorSpy).toHaveBeenCalledTimes(2);

      // Error from super handler is reported first
      expect(onerrorSpy.calls.argsFor(0)[0]).toEqual('super handler error');
      expect(onerrorSpy.calls.argsFor(0)[4]).toEqual(jasmine.any(Error));

      // Then error from initial exception
      expect(onerrorSpy.calls.argsFor(1)[0]).toEqual(`[v${VERSION.full}] initial error`);
      expect(onerrorSpy.calls.argsFor(1)[4]).toEqual(error);
    });

    it('should augment an error object with version info', () => {
      const originalMessage = 'this is an error message';
      const error = new Error(originalMessage);

      expect(error.message).toBe(originalMessage);
      // NOTE:
      // Intentionally not checking `error.stack` here, because accessing it causes the property to
      // be computed and may affect the observed behavior of `handleError()`.

      handler.handleError(error);

      expect(error.message).toBe(`[v${VERSION.full}] ${originalMessage}`);
      if (error.stack) {
        const expected = `Error: [v${VERSION.full}] ${originalMessage}`;
        const actual = error.stack.split('\n', 1)[0];
        expect(actual.startsWith(expected))
            .withContext(`Expected '${actual}' to start with '${expected}'.`)
            .toBeTrue();
      }
    });

    it('should send an error object to window.onerror', () => {
      const error = new Error('this is an error message');
      handler.handleError(error);
      expect(onerrorSpy).toHaveBeenCalledWith(error.message, undefined, undefined, undefined, error);
    });

    it('should send a non-error object to window.onerror', () => {
      const error = {reason: 'this is an error message'};
      handler.handleError(error);
      expect(onerrorSpy).toHaveBeenCalledWith(JSON.stringify(error));
    });

    it('should send a non-error object with circular references to window.onerror', () => {
      const error = {
        reason: 'this is an error message',
        get self() { return this; },
        toString() { return `{reason: ${this.reason}}`; },
      };
      handler.handleError(error);
      expect(onerrorSpy).toHaveBeenCalledWith('{reason: this is an error message}');
    });

    it('should send an error string to window.onerror (prefixed with version info)', () => {
      const error = 'this is an error message';
      handler.handleError(error);
      expect(onerrorSpy).toHaveBeenCalledWith(`[v${VERSION.full}] ${error}`);
    });

    it('should send a non-object, non-string error stringified to window.onerror', () => {
      handler.handleError(404);
      handler.handleError(false);
      handler.handleError(null);
      handler.handleError(undefined);

      expect(onerrorSpy.calls.allArgs()).toEqual([
        ['404'],
        ['false'],
        ['null'],
        ['undefined'],
      ]);
    });
  });
});
