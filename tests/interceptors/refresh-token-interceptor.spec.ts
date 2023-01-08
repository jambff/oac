import axios, { AxiosError, AxiosResponse } from 'axios';
import { createRefreshTokenInterceptor } from '../../src/interceptors';

jest.mock('axios');

describe('createRefreshTokenInterceptor', () => {
  describe('error', () => {
    it('makes the call again after refreshing the token', async () => {
      const newToken = '123abc';
      const finalResponse = { foo: 'bar' };
      const error = {
        response: {
          status: 401,
        },
        config: {
          url: 'http://example.org',
          headers: {
            Authorization: 'Bearer 123',
          },
        },
      } as unknown as AxiosError;

      (axios as unknown as jest.Mock).mockReturnValue(finalResponse);

      const refreshAccessToken = async () => newToken;

      const interceptor = createRefreshTokenInterceptor(refreshAccessToken);

      const result = await interceptor.error(error);

      expect(result).toEqual(finalResponse);
      expect(axios).toHaveBeenCalledWith({
        _retry: true,
        url: error.config.url,
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
    });

    it('rejects if there was no error.response', async () => {
      const error = {
        config: {
          url: 'http://example.org',
          headers: {
            Authorization: 'Bearer 123',
          },
        },
      } as unknown as AxiosError;

      const refreshAccessToken = async () => null;

      const interceptor = createRefreshTokenInterceptor(refreshAccessToken);

      await expect(interceptor.error(error)).rejects.toEqual(error);
    });

    it('rejects if error.response.status is not a 401', async () => {
      const error = {
        response: { status: 500 },
      } as AxiosError;

      const refreshAccessToken = async () => null;

      const interceptor = createRefreshTokenInterceptor(refreshAccessToken);

      await expect(interceptor.error(error)).rejects.toEqual(error);
    });

    it('rejects if the original call did not include an auth header', async () => {
      const error = {
        response: { status: 401 },
        config: {
          url: 'http://example.org',
        },
      } as AxiosError;

      const refreshAccessToken = async () => null;

      const interceptor = createRefreshTokenInterceptor(refreshAccessToken);

      await expect(interceptor.error(error)).rejects.toEqual(error);
    });

    it('rejects if a refreshed token is not returned', async () => {
      const refreshAccessToken = async () => null;
      const error = {} as AxiosError;

      const interceptor = createRefreshTokenInterceptor(refreshAccessToken);

      await expect(interceptor.error(error)).rejects.toEqual(error);
    });

    it('rejects if thre is no refresh access token function given', async () => {
      const error = {
        response: {
          status: 401,
        },
        config: {
          url: 'http://example.org',
          headers: {
            Authorization: 'Bearer 123',
          },
        },
      } as unknown as AxiosError;

      const interceptor = createRefreshTokenInterceptor();

      await expect(interceptor.error(error)).rejects.toEqual(error);
    });
  });

  describe('success', () => {
    it('returns the response on success', () => {
      const mockResponse = { foo: 'bar' };
      const refreshAccessToken = async () => null;
      const interceptor = createRefreshTokenInterceptor(refreshAccessToken);

      const result = interceptor.success(mockResponse as unknown as AxiosResponse);

      expect(result).toEqual(mockResponse);
    });
  });
});
