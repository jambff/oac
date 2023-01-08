import { AxiosError, AxiosResponse } from 'axios';
import { JamBffError } from '../../src/errors';
import { createResponseDebugInterceptor } from '../../src/interceptors';

const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('createResponseDebugInterceptor', () => {
  beforeEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('error', () => {
    it.each([400, 404])('does not log a %s error', async (statusCode) => {
      console.error = jest.fn();

      const error = {
        response: {
          status: statusCode,
          data: {
            statusCode,
            message: 'Client did something wrong',
            name: 'ClientError',
            errors: [],
          },
        },
        config: {
          url: '/endpoint',
          baseURL: 'http://api.com',
          method: 'get',
        },
      } as unknown as AxiosError;

      const onError = jest.fn();
      const interceptor = createResponseDebugInterceptor(onError);

      let err;

      try {
        interceptor.error(error);
      } catch (e) {
        err = e;
      }

      expect((err as JamBffError).message).toBe(
        `${statusCode} Client did something wrong [GET http://api.com/endpoint]`,
      );

      expect((err as JamBffError).statusCode).toBe(statusCode);
      expect((err as JamBffError).name).toBe('JamBffError');
      expect((err as JamBffError).errors).toEqual([]);

      expect(onError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('logs a 500 error', async () => {
      console.error = jest.fn();

      const error = {
        response: {
          status: 500,
          data: {
            statusCode: 500,
            message: 'Internal Server Error',
            name: 'BadRequest',
            errors: [],
          },
        },
        config: {
          url: '/endpoint',
          baseURL: 'http://api.com',
          method: 'get',
        },
      } as unknown as AxiosError;

      const interceptor = createResponseDebugInterceptor();

      let err;

      try {
        interceptor.error(error);
      } catch (e) {
        err = e;
      }

      expect((err as JamBffError).message).toBe(
        '500 Internal Server Error [GET http://api.com/endpoint]',
      );

      expect((err as JamBffError).statusCode).toBe(500);
      expect((err as JamBffError).name).toBe('JamBffError');
      expect((err as JamBffError).errors).toEqual([]);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(err);
    });

    it('logs a 500 error using a custom error handler', async () => {
      console.error = jest.fn();

      const error = {
        response: {
          status: 500,
          data: {
            statusCode: 500,
            message: 'Internal Server Error',
            name: 'BadRequest',
            errors: [],
          },
        },
        config: {
          url: '/endpoint',
          baseURL: 'http://api.com',
          method: 'post',
        },
      } as unknown as AxiosError;

      const onError = jest.fn();
      const interceptor = createResponseDebugInterceptor(onError);

      let err;

      try {
        interceptor.error(error);
      } catch (e) {
        err = e;
      }

      expect((err as JamBffError).message).toBe(
        '500 Internal Server Error [POST http://api.com/endpoint]',
      );

      expect((err as JamBffError).statusCode).toBe(500);
      expect((err as JamBffError).name).toBe('JamBffError');
      expect((err as JamBffError).errors).toEqual([]);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(err);

      expect(console.error).not.toHaveBeenCalled();
    });

    it.each([
      undefined,
      {},
      '',
    ])('logs an error when the API response data is "%s"', async (data) => {
      console.error = jest.fn();

      const error = {
        message: 'Bad thing',
        response: {
          status: 500,
          data,
        },
        config: {
          url: '/endpoint',
          baseURL: 'http://api.com',
          method: 'post',
        },
      } as unknown as AxiosError;

      const interceptor = createResponseDebugInterceptor();

      let err;

      try {
        interceptor.error(error);
      } catch (e) {
        err = e;
      }

      expect((err as JamBffError).message).toBe(
        '500 Bad thing [POST http://api.com/endpoint]',
      );

      expect((err as JamBffError).statusCode).toBe(500);
      expect((err as JamBffError).name).toBe('JamBffError');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(err);
    });

    it('logs an error when the response body does not exist', async () => {
      console.error = jest.fn();

      const error = {
        statusCode: 500,
        message: 'Bad thing',
        config: {
          url: '/endpoint',
          baseURL: 'http://api.com',
          method: 'get',
        },
      } as unknown as AxiosError;

      const interceptor = createResponseDebugInterceptor();

      let err;

      try {
        interceptor.error(error);
      } catch (e) {
        err = e;
      }

      expect((err as JamBffError).message).toBe(
        '500 Bad thing [GET http://api.com/endpoint]',
      );

      expect((err as JamBffError).statusCode).toBe(500);
      expect((err as JamBffError).name).toBe('JamBffError');
      expect((err as JamBffError).errors).toBeUndefined();

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(err);
    });
  });

  describe('success', () => {
    it('returns the response on success', () => {
      const mockResponse = { foo: 'bar' };
      const interceptor = createResponseDebugInterceptor();

      const result = interceptor.success(mockResponse as unknown as AxiosResponse);

      expect(result).toEqual(mockResponse);
    });
  });
});
