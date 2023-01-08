import { isJamBffError, JamBffError } from '../src/errors';

describe('Errors', () => {
  describe('isJamBffError', () => {
    it('returns true if an error is a JamBffError', () => {
      const error = new JamBffError(500, 'Internal Server Error');

      expect(isJamBffError(error)).toBe(true);
    });

    it('returns false if an error is not a JamBffError', () => {
      const error = new Error();

      expect(isJamBffError(error)).toBe(false);
    });

    it('returns false if an error is not an error object', () => {
      expect(isJamBffError('')).toBe(false);
    });
  });
});
