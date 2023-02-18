import { AxiosRequestConfig } from 'axios';

/**
 * Axios interceptor to log requests.
 */
export const createRequestDebugInterceptor = () => ({
  success: (config: AxiosRequestConfig) => {
    const { baseURL, method, url, params, paramsSerializer } = config;

    if (!url || !method) {
      return;
    }

    const urlObj = new URL(url, baseURL);

    if (params && paramsSerializer) {
      urlObj.search = `?${paramsSerializer(params)}`;
    }

    console.debug(`${method.toUpperCase()} ${urlObj.href}`);

    return config;
  },
  error: (error: any) => Promise.reject(error),
});
