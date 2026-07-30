import { describe, it, expect, vi } from 'vitest';

const { handleServiceError } = require('./errorHandler.js');
const { ValidationError, AccessDeniedError, NotFoundError, ConflictError, GoneError } = require('./errors.js');

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('handleServiceError', () => {
  it.each([
    [new ValidationError('bad input'), 400],
    [new AccessDeniedError('denied'), 403],
    [new NotFoundError('missing'), 404],
    [new ConflictError('conflict'), 409],
    [new GoneError('gone'), 410]
  ])('maps %o to status %i', (error, expectedStatus) => {
    const res = mockRes();
    handleServiceError(error, res);
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  it('falls back to 500 and logs for an unrecognized error', () => {
    const res = mockRes();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');

    handleServiceError(error, res, 'Custom prefix:');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Interner Serverfehler' });
    expect(errorSpy).toHaveBeenCalledWith('Custom prefix:', error);

    errorSpy.mockRestore();
  });

  it('uses the default log prefix when none is given', () => {
    const res = mockRes();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');

    handleServiceError(error, res);

    expect(errorSpy).toHaveBeenCalledWith('Service error:', error);
    errorSpy.mockRestore();
  });
});
