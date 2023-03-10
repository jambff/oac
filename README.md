# OAC

An auto-generated and type-safe [OpenAPI](https://swagger.io/specification/) client.

**Table of Contents**

- [Installation](#installation)
- [Generating the client](#generating-the-client)
- [Initialisation](#initialisation)
- [Usage](#usage)
- [Typescript](#typescript)
- [Authorization](#authorization)
- [Error handling](#error-handling)
- [Debugging](#debugging)
- [Forced upgrades](#forced-upgrades)
- [Mocking](#mocking)

## Installation

```sh
yarn add @jambff/oac
```

## Generating the client

This repository exposes a command line tool that you can run to generate the
OpenAPI client. After installing the package you can generate the client from
an OpenAPI specification with the following command:

```text
yarn oac http://example.api.com/docs.json
```

Alternatively, you can use a JSON file:

```text
yarn oac -f spec.json
```

Where `spec.json` is the location of the OpenAPI specification file from which
you want to generate the client.

## Usage

Once the API client has been generated it can be instantiated as follows:

```js
import { createOpenApiClient } from '@jambff/oac';

const client = createOpenApiClient.create({
  baseUrl: 'http://example.api.com',
  getAccessToken: () => 'my-access-token',
  refreshAccessToken: () => 'my-new-access-token',
  onError: console.error,
});
```

The resulting API client object exposes functions for each API operation. Each
function is called with an object containing the following properties:

### `params`

An object containing properties that are mapped to any named route parameters.
For example, if you have the route `/user/:name`, then the `name` property should
be passed in as `params: { name: 'Alex' }`.

### `query`

An object containing a property for each query string parameter.

### `data`

An object containing key-value to submit as the request body
(i.e. for POST or PUT requests).

---

For example, given the following (simplified) OpenAPI specification:

```json
{
  "openapi": "3.0.1",
  "info": {
    "title": "My API"
  },
  "paths": {
    "/example/{id}/get-stuff": {
      "get": {
        "operationId": "myExampleOperation",
        "parameters": [
          {
            "name": "id",
            "in": "path"
          },
          {
            "name": "limit",
            "in": "query"
          }
        ]
      }
    }
  }
}
```

When we run this code:

```js
import { createOpenApiClient } from '@jambff/oac';

const client = createOpenApiClient({ baseUrl: 'http://example.api.com' });

client.myExampleOperation({
  params: { id: 123 },
  query: { limit: 1 },
});
```

A request like this would be made:

```text
GET /example/123/get-stuff?limit=1
```

### Query parameter serialization

Arrays are serialized in the brackets format, for example:

```js
import { createOpenApiClient } from '@jambff/oac';

const client = createOpenApiClient({ baseUrl: 'http://example.api.com' });

client.search({
  params: { id: 123 },
  query: {
    text: 'hello',
    filter: ['world'],
    sort: {
      asc: 'foo',
    }
  },
});
```

Becomes:

```text
GET /example/123/get-stuff?text=hello&filter[]=world&sort[asc]=foo
```

## Typescript

Two types are generated for each API operation. One for the options
(`params`, `query` and `data`) and one for the response, for example:

```js
import {
  createOpenApiClient,
  MyExampleOptions,
  MyExampleResponse,
} from '@jambff/oac';

const client = createOpenApiClient({ baseUrl: 'http://example.api.com' });

export const getMyExample = (
  options: MyExampleOptions
): MyExampleResponse => (
  client.myExampleOperation(options)
);
```

Types are also generated for each [OpenAPI component](https://swagger.io/docs/specification/components/)
present in your specification. These can be imported from `ApiComponents`, for example:

```ts
import { ApiComponents } from '@jambff/oac';

const post: ApiComponents['Post'] = {
  title: 'My Post',
};
```

## Authorization

The API client supports JWT token-based authentication. Any access token
provided via the `getAccessToken()` function will be automatically attached to
requests that require it. That is, those marked where the operation in the
OpenAPI specs has a `security` property.

If a request fails an attempt is made to refresh the token by calling the
`refreshAccessToken()` function and the request is retried. If the retry fails a
401 error will be thrown, at which point the consuming application can handle
this error as appropriate (e.g. redirect the user to sign in again). If the
access token has expired an attempt will be made to refresh the token
before making the initial request, thus saving on unnecessary API calls.

## Error handling

Any HTTP errors encountered when using the client will be thrown as error object
that includes the following properties:

| Property     | Description                                             |
|--------------|---------------------------------------------------------|
| `statusCode` | The HTTP status code.                                   |
| `name`       | The name of the error.                                  |
| `message`    | An error message.                                       |
| `errors`     | An array containing any validation errors (see below).  |

If the request resulted in validation errors, such as a query parameter being
in the wrong format, then `errors` will include one or more objects with the
following properties:

| Property     | Description                                             |
|--------------|---------------------------------------------------------|
| `property`   | The name of the property that failed validation.        |
| `constraint` | The name of the constraint that failed.                 |
| `message`    | A message explaining why the constraint failed.         |

The `isOpenApiClientError()` function can be used to determine if an error is an
expected OpenAPI client error (i.e. an HTTP error), for example:

```js
import { createOpenApiClient, isOpenApiClientError } from '@jambff/oac';

const client = createOpenApiClient({ baseUrl: 'http://example.api.com' });

try {
  await client.myExampleOperation();
} catch(err) {
  if (isOpenApiClientError(err)) {
    console.error(`HTTP Error: ${err.statusCode}`);

    return;
  }

  throw err;
}
```

Errors will be logged to the console. To implement custom error handling you
can pass an `onError()` callback when setting up the client.

## Debugging

You can log all outgoing requests by passing the `debug` property when creating
the client:

```js
import { createOpenApiClient } from '@jambff/oac';

const client = createOpenApiClient({
  baseUrl: 'http://example.api.com',
  debug: true,
});
```

## Forced upgrades

The API client will send an `Accept` header with every request in the format:

```text
application/vnd.jambff+json; version=[VERSION]
```

Where `VERSION` is the version from the package.json of your repository. If you
release a breaking change to your API you may want to build in a mechanism that
parses this header and responds with a 406 status code if it determines that
the version is no longer supported.

In your consuming application you can pass in a callback when creating the
client as below. This callback will be fired whenever the client encounters a
406 response.

```js
import { createOpenApiClient } from '@jambff/oac';

const onUpgradeRequired = () => {
  // Handle upgrade logic
};

const client = createOpenApiClient.create({
  baseUrl: 'http://example.api.com',
  onUpgradeRequired,
});
```

## Mocking

You can create a type-safe mock API client by installing the `jest-mock-extended`
package:

```text
yarn add jest-mock-extended -D
```

Creating a file containing something like the following:

```js
// jest.mockApiClient.ts
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  create,
  createOpenApiClient,
  OpenApiClient,
  OpenApiRequest,
} from '@immediate_media/openapi-client';

const noop = {} as OpenApiRequest;
const operations = create(noop);

jest.mock('@immediate_media/openapi-client', () => ({
  ...jest.requireActual('@immediate_media/openapi-client'),
  createOpenApiClient: jest.fn(),
}));

const mockClient = mockDeep<OpenApiClient>() as DeepMockProxy<OpenApiClient> & {
  [x: string]: jest.Mock;
};

(createOpenApiClient as jest.Mock).mockReturnValue(mockClient);

Object.keys(operations).forEach((key) => {
  mockClient[key].mockImplementation(() => {
    console.warn(
      `No mock return value set for API client operation ${key}. ` +
        'Try adding a mock resolved value, for example: ' +
        `\`apiClient.${key}.mockResolvedValue({ foo: 'bar' })\``,
    );
  });
});
```

Adding the following to your Jest
[`setupFilesAfterEnv`](https://jestjs.io/docs/configuration#setupfilesafterenv-array)
array:

```js
module.exports = {
  setupFilesAfterEnv: [
    './node_modules/@immediate_media/openapi-client/mock.ts',
  ],
};
```

Then in your tests you can then create a mock client by calling the
`createOpenApiClient()` function. All operations will have been replaced with
Jest mocks, meaning you can mock API responses like so:

```ts
const client = createOpenApiClient({ baseURL: 'http://example.api.com' });

client.myOperation.mockResolvedValue({ foo: 'bar' });
```
