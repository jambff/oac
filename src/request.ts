import { AxiosRequestConfig, AxiosInstance } from 'axios';
import { getAuthorizationHeader, TokenRetrieverFunction } from './auth';
import { OperationConfig, OperationOptions } from './generated';

/**
* Slot path parameters into an endpoint.
*/
const populateEndpoint = (endpoint: string, options?: OperationOptions) => {
  let populatedEndpoint = endpoint;

  if (options?.params) {
    Object.entries(options.params)
      .filter(([, value]) => value != null && value !== '')
      .forEach(([key, value]) => {
        populatedEndpoint = populatedEndpoint.replace(new RegExp(`{${key}}`), String(value));
      });
  }

  const remainingMatches = populatedEndpoint.match(/\{.*\}/g);

  if (remainingMatches?.length) {
    throw new Error(`Missing required path parameter(s): ${remainingMatches.join(', ')}`);
  }

  return populatedEndpoint;
};

/**
 * Create the request function that is passed to the operations file.
 */
export const createRequestFunction = (
  axiosInstance: AxiosInstance,
  getAccessToken?: TokenRetrieverFunction,
  refreshAccessToken?: TokenRetrieverFunction,
) => async (
  operationConfig: OperationConfig,
  options?: OperationOptions,
) => {
  const { endpoint, method, secure } = operationConfig;

  const axiosRequestConfig: AxiosRequestConfig = {
    url: populateEndpoint(endpoint, options),
    method,
  };

  if (options?.data && Object.keys(options.data).length) {
    axiosRequestConfig.data = options.data;
  }

  if (options?.query && Object.keys(options.query).length) {
    axiosRequestConfig.params = options.query;
  }

  const authorization = await getAuthorizationHeader(secure, getAccessToken, refreshAccessToken);

  if (authorization) {
    axiosRequestConfig.headers = { Authorization: authorization };
  }

  const res = await axiosInstance.request(axiosRequestConfig);

  return res.data;
};
