import { AxiosResponse } from 'axios';
import { OpenApiClientError } from '../errors';

export const createResponseDebugInterceptor = (
  onError?: (error: any) => void,
  debug?: boolean,
) => ({
  success: (res: AxiosResponse) => res,
  error: (error: any) => {
    const { config, response, message, statusCode } = error;

    const { method } = config;
    const { data, status } = response || {};
    const finalStatus = status ?? statusCode;
    const isServerError = Number.isFinite(finalStatus) && finalStatus >= 500;
    const endpoint = `/${config.url}`.replace(/\/\//g, '/');
    const url = `${config.baseURL}${endpoint}`;
    const msg = `${finalStatus} ${
      data?.message || message
    } <${method.toUpperCase()} ${url}>`;

    const openApiClientError = new OpenApiClientError(
      finalStatus,
      msg,
      data?.errors,
    );
    const logError = onError || console.error;

    if (isServerError || debug) {
      logError(openApiClientError);
    }

    throw openApiClientError;
  },
});
