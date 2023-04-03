type ValidationError = {
  property: string;
  constraint: string;
  message: string;
};

export class OpenApiClientError extends Error {
  statusCode: number;

  data?: Record<string, any>;

  errors?: ValidationError[];

  isOpenApiClientError = true;

  constructor(
    statusCode: number,
    message: string,
    errors?: ValidationError[],
    data?: Record<string, any>,
  ) {
    super(
      `${message}${
        errors?.length
          ? ` ${errors
              ?.map(
                (err) => `${err.property} (${err.constraint}) ${err.message}`,
              )
              .join(' | ')}`
          : ''
      }`,
    );

    this.data = data;
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
