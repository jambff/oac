// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { create, OpenApiRequest } from '../client';
import { OpenApiClientError } from '../errors';

const noop = {} as OpenApiRequest;

const operations = create(noop);

const mockClient = Object.keys(operations).reduce(
  (acc, operation) => ({
    ...acc,
    // @ts-ignore
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
// @ts-ignore
export const createOpenApiClient = jest.fn(() => mockClient);

// Use the real isOpenApiClientError function.
// @ts-ignore
export const isOpenApiClientError = jest.fn((err) =>
  // @ts-ignore
  jest.requireActual('../errors').isOpenApiClientError(err),
);
