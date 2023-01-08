type ValidationError = {
  property: string;
  constraint: string;
  message: string;
};

export class OpenApiClientError extends Error {
  statusCode: number;

  errors?: ValidationError[];

  isOpenApiClientError = true;

  constructor(statusCode: number, message: string, errors?: ValidationError[]) {
    super(message);

    this.statusCode = statusCode;
    this.name = 'OpenApiClientError';
    this.errors = errors;
  }
}

/**
 * Determines whether a value is (probably) an error thrown by the API client.
 */
export const isOpenApiClientError = (val: any): val is OpenApiClientError =>
  !!val?.isOpenApiClientError;
