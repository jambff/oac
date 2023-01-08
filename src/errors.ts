type ValidationError = {
  property: string;
  constraint: string;
  message: string;
}

export class JamBffError extends Error {
  statusCode: number;

  errors?: ValidationError[];

  isJamBffError = true;

  constructor(
    statusCode: number,
    message: string,
    errors?: ValidationError[],
  ) {
    super(message);

    this.statusCode = statusCode;
    this.name = 'JamBffError';
    this.errors = errors;
  }
}

/**
 * Determines whether a value is (probably) an error thrown by the API client.
 */
export const isJamBffError = (val: any): val is JamBffError => !!val?.isJamBffError;
