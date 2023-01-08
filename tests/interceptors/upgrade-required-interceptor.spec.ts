import { AxiosError, AxiosResponse } from 'axios';
import { createUpgradeRequiredInterceptor } from '../../src/interceptors';

const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('createUpgradeRequiredInterceptor', () => {
  beforeEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('error', () => {
    it('upgrades for a 406 error', async () => {
      console.error = jest.fn();

      const error = {
        response: {
          status: 406,
        },
      } as unknown as AxiosError;

      const onUpgradeRequired = jest.fn();
      const interceptor = createUpgradeRequiredInterceptor(onUpgradeRequired);

      try {
        await expect(interceptor.error(error)).rejects.toEqual(error);
      } catch (e) {
        // Do nothing
      }

      expect(onUpgradeRequired).toHaveBeenCalledTimes(1);
    });

    it('upgrades for a 406 error with no response body', async () => {
      console.error = jest.fn();

      const error = {
        statusCode: 406,
      } as unknown as AxiosError;

      const onUpgradeRequired = jest.fn();
      const interceptor = createUpgradeRequiredInterceptor(onUpgradeRequired);

      try {
        await expect(interceptor.error(error)).rejects.toEqual(error);
      } catch (e) {
        // Do nothing
      }

      expect(onUpgradeRequired).toHaveBeenCalledTimes(1);
    });

    it.each([400, 404, 500])(
      'does not upgrade for a %s error',
      async (statusCode) => {
        console.error = jest.fn();

        const error = {
          response: {
            status: statusCode,
          },
        } as unknown as AxiosError;

        const onUpgradeRequired = jest.fn();
        const interceptor = createUpgradeRequiredInterceptor(onUpgradeRequired);

        try {
          await expect(interceptor.error(error)).rejects.toEqual(error);
        } catch (e) {
          // Do nothing
        }

        expect(onUpgradeRequired).not.toHaveBeenCalled();
      },
    );

    it('does not upgrade for a non-406 error with no response body', async () => {
      console.error = jest.fn();

      const error = {
        statusCode: 404,
      } as unknown as AxiosError;

      const onUpgradeRequired = jest.fn();
      const interceptor = createUpgradeRequiredInterceptor(onUpgradeRequired);

      try {
        await expect(interceptor.error(error)).rejects.toEqual(error);
      } catch (e) {
        // Do nothing
      }

      expect(onUpgradeRequired).not.toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('returns the response on success', () => {
      const mockResponse = { foo: 'bar' };
      const interceptor = createUpgradeRequiredInterceptor();

      const result = interceptor.success(
        mockResponse as unknown as AxiosResponse,
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
