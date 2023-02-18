import axios from 'axios';
import { createOpenApiClient, OpenApiClientOptions } from '../src/create';
import { create } from '../src/generated';
import { createRequestFunction } from '../src/request';
import {
  createRefreshTokenInterceptor,
  createEconnresetInterceptor,
  createResponseDebugInterceptor,
  createUpgradeRequiredInterceptor,
  createRequestDebugInterceptor,
} from '../src/interceptors';

jest.mock('axios');
jest.mock('../src/request');
jest.mock('../src/interceptors');
jest.mock(
  '../src/version',
  () => ({
    version: '42.3.4',
  }),
  { virtual: true },
);

jest.mock('../src/generated');
jest.mock(
  '../src/client',
  () => ({
    create: () => 'mock-oac',
  }),
  { virtual: true },
);

jest.mock(
  '../src/types',
  () => ({
    components: [],
  }),
  { virtual: true },
);

const mockAxiosClient = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

describe('Create', () => {
  beforeEach(() => {
    (create as jest.Mock).mockReturnValue('mock-oac');
    (axios.create as jest.Mock).mockReturnValue(mockAxiosClient);
    (createRequestFunction as jest.Mock).mockReturnValue('mock-request');

    (createRefreshTokenInterceptor as jest.Mock).mockReturnValue({
      success: 'mock-refresh-access-token-interceptor:success',
      error: 'mock-refresh-access-token-interceptor:error',
    });

    (createEconnresetInterceptor as jest.Mock).mockReturnValue({
      success: 'mock-econnreset-interceptor:success',
      error: 'mock-econnreset-interceptor:error',
    });

    (createResponseDebugInterceptor as jest.Mock).mockReturnValue({
      success: 'mock-response-debug-interceptor:success',
      error: 'mock-response-debug-interceptor:error',
    });

    (createUpgradeRequiredInterceptor as jest.Mock).mockReturnValue({
      success: 'mock-upgrade-required-interceptor:success',
      error: 'mock-upgrade-required-interceptor:error',
    });

    (createRequestDebugInterceptor as jest.Mock).mockReturnValue({
      success: 'mock-request-debug-interceptor:success',
      error: 'mock-request-debug-interceptor:error',
    });
  });

  describe('createOpenApiClient', () => {
    it('creates an axios instance', () => {
      const client = createOpenApiClient({
        baseURL: 'http://api.com',
        getAccessToken: () => null,
        refreshAccessToken: () => null,
      });

      expect(client).toBe('mock-oac');

      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://api.com',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.jambff+json; version=42.3.4',
        },
        paramsSerializer: expect.any(Function),
      });
    });

    it('sets up the paramsSerializer as expected', () => {
      createOpenApiClient({
        baseURL: 'http://api.com',
        getAccessToken: () => null,
        refreshAccessToken: () => null,
      });

      const { paramsSerializer } = (axios.create as jest.Mock).mock.calls[0][0];

      expect(paramsSerializer({ foo: 'bar' })).toBe('foo=bar');
      expect(paramsSerializer({ foo: ['bar', 'baz'] })).toBe(
        'foo[]=bar&foo[]=baz',
      );
    });

    it('creates a client based on an axios instance', () => {
      const getAccessToken = () => null;
      const refreshAccessToken = () => null;
      const client = createOpenApiClient({
        baseURL: 'http://api.com',
        getAccessToken,
        refreshAccessToken,
      });

      expect(client).toBe('mock-oac');

      expect(createRequestFunction).toHaveBeenCalledTimes(1);
      expect(createRequestFunction).toHaveBeenCalledWith(
        mockAxiosClient,
        getAccessToken,
        refreshAccessToken,
      );

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith('mock-request');
    });

    it('throws if no base URL given', () => {
      expect(() =>
        createOpenApiClient({
          getAccessToken: () => null,
          refreshAccessToken: () => null,
        } as OpenApiClientOptions),
      ).toThrow('A `baseURL` must be given');
    });

    it('registers the default interceptors', () => {
      const getAccessToken = () => null;
      const refreshAccessToken = () => null;
      const onError = () => null;

      createOpenApiClient({
        baseURL: 'http://api.com',
        getAccessToken,
        refreshAccessToken,
        onError,
      });

      expect(createRefreshTokenInterceptor).toHaveBeenCalledTimes(1);
      expect(createRefreshTokenInterceptor).toHaveBeenCalledWith(
        refreshAccessToken,
      );

      expect(createEconnresetInterceptor).toHaveBeenCalledTimes(1);
      expect(createEconnresetInterceptor).toHaveBeenCalledWith();

      expect(createResponseDebugInterceptor).toHaveBeenCalledTimes(1);
      expect(createResponseDebugInterceptor).toHaveBeenCalledWith(onError);

      expect(mockAxiosClient.interceptors.response.use).toHaveBeenCalledTimes(
        3,
      );

      expect(mockAxiosClient.interceptors.response.use).toHaveBeenCalledWith(
        'mock-refresh-access-token-interceptor:success',
        'mock-refresh-access-token-interceptor:error',
      );

      expect(mockAxiosClient.interceptors.response.use).toHaveBeenCalledWith(
        'mock-econnreset-interceptor:success',
        'mock-econnreset-interceptor:error',
      );

      expect(mockAxiosClient.interceptors.response.use).toHaveBeenCalledWith(
        'mock-response-debug-interceptor:success',
        'mock-response-debug-interceptor:error',
      );
    });

    it('registers the forced upgrade interceptor if a callback was given', () => {
      const onUpgradeRequired = () => null;

      createOpenApiClient({
        baseURL: 'http://api.com',
        onUpgradeRequired,
      });

      expect(createUpgradeRequiredInterceptor).toHaveBeenCalledTimes(1);
      expect(createUpgradeRequiredInterceptor).toHaveBeenCalledWith(
        onUpgradeRequired,
      );

      expect(mockAxiosClient.interceptors.response.use).toHaveBeenCalledWith(
        'mock-upgrade-required-interceptor:success',
        'mock-upgrade-required-interceptor:error',
      );
    });

    it('registers the request debug interceptor in debug mode', () => {
      createOpenApiClient({
        baseURL: 'http://api.com',
        debug: true,
      });

      expect(createRequestDebugInterceptor).toHaveBeenCalledTimes(1);
      expect(createRequestDebugInterceptor).toHaveBeenCalledWith();

      expect(mockAxiosClient.interceptors.request.use).toHaveBeenCalledWith(
        'mock-request-debug-interceptor:success',
        'mock-request-debug-interceptor:error',
      );
    });
  });
});
