import axios, { AxiosInstance } from 'axios';
import qs from 'qs';
import { create, OpenApiClient, version } from './generated';
import { createRequestFunction } from './request';
import {
  createRefreshTokenInterceptor,
  createEconnresetInterceptor,
  createResponseDebugInterceptor,
  createUpgradeRequiredInterceptor,
} from './interceptors';
import { getBaseUrl, OpenApiClientEnv } from './config';
import { TokenRetrieverFunction } from './auth';

export type OpenApiClientOptions = {
  env: OpenApiClientEnv;
  baseURL?: string;
  getAccessToken?: TokenRetrieverFunction;
  refreshAccessToken?: TokenRetrieverFunction;
  onError?: (error: any) => void;
  onUpgradeRequired?: () => void;
};

/**
 * Create the base axios instance.
 */
const createAxiosInstance = ({
  env,
  baseURL,
  refreshAccessToken,
  onError,
  onUpgradeRequired,
}: OpenApiClientOptions): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: getBaseUrl(env, baseURL),
    headers: {
      'Content-Type': 'application/json',
      Accept: `application/vnd.jambff+json; version=${version}`,
    },
    paramsSerializer: (params) =>
      qs.stringify(params, {
        arrayFormat: 'brackets',
      }),
  });

  const refreshTokenInterceptor =
    createRefreshTokenInterceptor(refreshAccessToken);

  const econnresetInterceptor = createEconnresetInterceptor();
  const responseDebugInterceptor = createResponseDebugInterceptor(onError);
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

  axiosInstance.interceptors.response.use(
    upgradeRequiredInterceptor.success,
    upgradeRequiredInterceptor.error,
  );

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
