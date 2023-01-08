import { isOpenApiClientError, OpenApiClientError } from '../src/errors';

describe('Errors', () => {
  describe('isOpenApiClientError', () => {
    it('returns true if an error is a OpenApiClientError', () => {
      const error = new OpenApiClientError(500, 'Internal Server Error');

      expect(isOpenApiClientError(error)).toBe(true);
    });

    it('returns false if an error is not a OpenApiClientError', () => {
      const error = new Error();

      expect(isOpenApiClientError(error)).toBe(false);
    });

    it('returns false if an error is not an error object', () => {
      expect(isOpenApiClientError('')).toBe(false);
    });
  });
});
