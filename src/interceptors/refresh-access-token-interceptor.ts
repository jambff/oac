import axios, { AxiosError, AxiosResponse } from 'axios';
import { TokenRetrieverFunction } from '../auth';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

/**
 * Axios interceptor to retry a request after refreshing an access token.
 */
export const createRefreshTokenInterceptor = (
  refreshAccessToken?: TokenRetrieverFunction,
) => ({
  success: (res: AxiosResponse) => res,
  error: async (error: AxiosError) => {
    const { config, response } = error;

    if (
      refreshAccessToken &&
      response?.status === 401 && // Authentication failed for original req
      config.headers?.Authorization && // and it included an Authorization header
      !config._retry // and we haven't already retried
    ) {
      config._retry = true;

      const token = await refreshAccessToken();

      if (!token) {
        return Promise.reject(error);
      }

      config.headers.Authorization = `Bearer ${token}`;

      return axios(config);
    }

    return Promise.reject(error);
  },
});
