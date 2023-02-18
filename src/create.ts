import axios, { AxiosInstance } from 'axios';
import qs from 'qs';
import { create, OpenApiClient, version } from './generated';
import { createRequestFunction } from './request';
import {
  createRefreshTokenInterceptor,
  createEconnresetInterceptor,
  createResponseDebugInterceptor,
  createUpgradeRequiredInterceptor,
  createRequestDebugInterceptor,
} from './interceptors';
import { TokenRetrieverFunction } from './auth';

export type OpenApiClientOptions = {
  baseURL: string;
  getAccessToken?: TokenRetrieverFunction;
  refreshAccessToken?: TokenRetrieverFunction;
  onError?: (error: any) => void;
  onUpgradeRequired?: () => void;
  debug?: boolean;
};

/**
 * Create the base axios instance.
 */
const createAxiosInstance = ({
  baseURL,
  refreshAccessToken,
  onError,
  onUpgradeRequired,
  debug,
}: OpenApiClientOptions): AxiosInstance => {
  if (!baseURL) {
    throw new Error('A `baseURL` must be given');
  }

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: `application/vnd.jambff+json; version=${version}`,
    },
    paramsSerializer: (params) =>
      qs.stringify(params, {
        encodeValuesOnly: true,
        arrayFormat: 'brackets',
      }),
  });

  const refreshTokenInterceptor =
    createRefreshTokenInterceptor(refreshAccessToken);

  const econnresetInterceptor = createEconnresetInterceptor();
  const responseDebugInterceptor = createResponseDebugInterceptor(
    onError,
    debug,
  );

  const requestDebugInterceptor = createRequestDebugInterceptor();
  const upgradeRequiredInterceptor =
    createUpgradeRequiredInterceptor(onUpgradeRequired);

  axiosInstance.interceptors.response.use(
    refreshTokenInterceptor.success,
    refreshTokenInterceptor.error,
  );

  axiosInstance.interceptors.response.use(
    econnresetInterceptor.success,
    econnresetInterceptor.error,
  );

  axiosInstance.interceptors.response.use(
    responseDebugInterceptor.success,
    responseDebugInterceptor.error,
  );

  if (onUpgradeRequired) {
    axiosInstance.interceptors.response.use(
      upgradeRequiredInterceptor.success,
      upgradeRequiredInterceptor.error,
    );
  }

  if (debug) {
    axiosInstance.interceptors.request.use(
      requestDebugInterceptor.success,
      requestDebugInterceptor.error,
    );
  }

  return axiosInstance;
};

/**
 * Create the API client.
 */
export const createOpenApiClient = (
  options: OpenApiClientOptions,
): OpenApiClient => {
  const axiosInstance = createAxiosInstance(options);
  const request = createRequestFunction(
    axiosInstance,
    options.getAccessToken,
    options.refreshAccessToken,
  );

  return create(request);
};
