// @ts-ignore
import { create, OpenApiRequest } from '../client';
import { OpenApiClientError } from '../errors';

const noop = {} as OpenApiRequest;

const operations = create(noop);

const mockClient = Object.keys(operations).reduce(
  (acc, operation) => ({
    ...acc,
    [operation]: jest.fn(() => {
      console.warn(
        `No mock return value set for operation ${operation}. ` +
          'Try adding a mock resolved value, for example: ' +
          `\`(openapiClient.${operation} as jest.Mock).mockResolvedValue({ foo: 'bar' })\``,
      );

      throw new OpenApiClientError(404, 'Not Found');
    }),
  }),
  {},
);

export { OpenApiClientError };

// Create a mock OpenAPI client.
export const createOpenApiClient = jest.fn(() => mockClient);

// Use the real isOpenApiClientError function.
export const isOpenApiClientError = jest.fn((err) =>
  jest.requireActual('../errors').isOpenApiClientError(err),
);
