import axios from 'axios';
import { createOpenApiClient, OpenApiClientOptions } from '../src/create';
import { OpenApiClientEnv } from '../src/config';
import { create } from '../src/generated';
import { createRequestFunction } from '../src/request';
import {
  createRefreshTokenInterceptor,
  createEconnresetInterceptor,
  createResponseDebugInterceptor,
  createUpgradeRequiredInterceptor,
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
    create: () => 'mock-openapi-client',
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

type BaseUrls = {
  [x: string]: string;
};

const mockAxiosClient = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const baseUrls: BaseUrls = {
  staging: 'https://example.staging-api.co.uk',
  production: 'https://example.api.co.uk',
};

describe('Create', () => {
  beforeEach(() => {
    (create as jest.Mock).mockReturnValue('mock-openapi-client');
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
  });

  describe('createOpenApiClient', () => {
    it.each(['staging', 'production'] as OpenApiClientEnv[])(
      'creates an axios instance for the %s environment',
      (env) => {
        const client = createOpenApiClient({
          env,
          getAccessToken: () => null,
          refreshAccessToken: () => null,
        });

        expect(client).toBe('mock-openapi-client');

        expect(axios.create).toHaveBeenCalledTimes(1);
        expect(axios.create).toHaveBeenCalledWith({
          baseURL: baseUrls[env],
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/vnd.jambff+json; version=42.3.4',
          },
          paramsSerializer: expect.any(Function),
        });
      },
    );

    it('creates a client based on an axios instance', () => {
      const getAccessToken = () => null;
      const refreshAccessToken = () => null;
      const client = createOpenApiClient({
        env: 'staging',
        getAccessToken,
        refreshAccessToken,
      });

      expect(client).toBe('mock-openapi-client');

      expect(createRequestFunction).toHaveBeenCalledTimes(1);
      expect(createRequestFunction).toHaveBeenCalledWith(
        mockAxiosClient,
        getAccessToken,
        refreshAccessToken,
      );

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith('mock-request');
    });

    it('creates an axios instance with a base URL rather than an env', () => {
      const client = createOpenApiClient({
        env: 'staging',
        baseURL: 'http://127.0.0.1:7000',
        getAccessToken: () => null,
        refreshAccessToken: () => null,
      });

      expect(client).toBe('mock-openapi-client');

      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://127.0.0.1:7000',
        }),
      );
    });

    it('throws if an unknown env is given', () => {
      expect(() =>
        createOpenApiClient({
          env: 'unknown' as OpenApiClientEnv,
          getAccessToken: () => null,
          refreshAccessToken: () => null,
        }),
      ).toThrow('Not a known `env`: unknown');
    });

    it('throws if no env or base URL is given', () => {
      expect(() =>
        createOpenApiClient({
          getAccessToken: () => null,
          refreshAccessToken: () => null,
        } as OpenApiClientOptions),
      ).toThrow('Either a `baseURL` or an `env` must be given');
    });

    it('registers the interceptors', () => {
      const getAccessToken = () => null;
      const refreshAccessToken = () => null;
      const onError = () => null;

      createOpenApiClient({
        env: 'staging',
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
        4,
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

      expect(mockAxiosClient.interceptors.response.use).toHaveBeenCalledWith(
        'mock-upgrade-required-interceptor:success',
        'mock-upgrade-required-interceptor:error',
      );
    });
  });
});
