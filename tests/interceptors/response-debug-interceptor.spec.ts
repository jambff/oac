import { AxiosError, AxiosResponse } from 'axios';
import { OpenApiClientError } from '../../src/errors';
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

      expect((err as OpenApiClientError).message).toBe(
        `${statusCode} Client did something wrong <GET http://api.com/endpoint>`,
      );

      expect((err as OpenApiClientError).statusCode).toBe(statusCode);
      expect((err as OpenApiClientError).name).toBe('OpenApiClientError');
      expect((err as OpenApiClientError).errors).toEqual([]);

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

      expect((err as OpenApiClientError).message).toBe(
        '500 Internal Server Error <GET http://api.com/endpoint>',
      );

      expect((err as OpenApiClientError).statusCode).toBe(500);
      expect((err as OpenApiClientError).name).toBe('OpenApiClientError');
      expect((err as OpenApiClientError).errors).toEqual([]);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect((console.error as jest.Mock).mock.calls[0][0]).toMatchSnapshot();
    });

    it('logs a 400 error if in debug mode', async () => {
      console.error = jest.fn();

      const errors = [
        {
          constraint: 'isInt',
          message: 'id must be an integer number',
          property: 'id',
        },
        {
          constraint: 'isString',
          message: 'name must be a string',
          property: 'name',
        },
      ];

      const error = {
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: 'Bad Request',
            name: 'BadRequest',
            errors,
          },
        },
        config: {
          url: '/endpoint',
          baseURL: 'http://api.com',
          method: 'put',
        },
      } as unknown as AxiosError;

      const interceptor = createResponseDebugInterceptor(undefined, true);

      let err;

      try {
        interceptor.error(error);
      } catch (e) {
        err = e;
      }

      expect((err as OpenApiClientError).message).toBe(
        '400 Bad Request <PUT http://api.com/endpoint> id (isInt) id must be an integer number | name (isString) name must be a string',
      );

      expect((err as OpenApiClientError).statusCode).toBe(400);
      expect((err as OpenApiClientError).name).toBe('OpenApiClientError');
      expect((err as OpenApiClientError).errors).toEqual(errors);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect((console.error as jest.Mock).mock.calls[0][0]).toMatchSnapshot();
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

      expect((err as OpenApiClientError).message).toBe(
        '500 Internal Server Error <POST http://api.com/endpoint>',
      );

      expect((err as OpenApiClientError).statusCode).toBe(500);
      expect((err as OpenApiClientError).name).toBe('OpenApiClientError');
      expect((err as OpenApiClientError).errors).toEqual([]);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(err);

      expect(console.error).not.toHaveBeenCalled();
    });

    it.each([undefined, {}, ''])(
      'logs an error when the API response data is "%s"',
      async (data) => {
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

        expect((err as OpenApiClientError).message).toBe(
          '500 Bad thing <POST http://api.com/endpoint>',
        );

        expect((err as OpenApiClientError).statusCode).toBe(500);
        expect((err as OpenApiClientError).name).toBe('OpenApiClientError');

        expect(console.error).toHaveBeenCalledTimes(1);
        expect((console.error as jest.Mock).mock.calls[0][0]).toMatchSnapshot();
      },
    );

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

      expect((err as OpenApiClientError).message).toBe(
        '500 Bad thing <GET http://api.com/endpoint>',
      );

      expect((err as OpenApiClientError).statusCode).toBe(500);
      expect((err as OpenApiClientError).name).toBe('OpenApiClientError');
      expect((err as OpenApiClientError).errors).toBeUndefined();

      expect(console.error).toHaveBeenCalledTimes(1);
      expect((console.error as jest.Mock).mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('success', () => {
    it('returns the response on success', () => {
      const mockResponse = { foo: 'bar' };
      const interceptor = createResponseDebugInterceptor();

      const result = interceptor.success(
        mockResponse as unknown as AxiosResponse,
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
