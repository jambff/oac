// @ts-ignore
import { create, JamBffRequest } from '../client';
import { JamBffError } from '../errors';

const noop = {} as JamBffRequest;

const operations = create(noop);

const mockClient = Object.keys(operations).reduce((acc, operation) => ({
  ...acc,
  [operation]: jest.fn(() => {
    console.warn(
      `No mock return value set for operation ${operation}. `
      + 'Try adding a mock resolved value, for example: '
      + `\`(jambff.${operation} as jest.Mock).mockResolvedValue({ foo: 'bar' })\``,
    );

    throw new JamBffError(404, 'Not Found');
  }),
}), {});

export { JamBffError };

// Create a mock Jambff client.
export const createJamBffClient = jest.fn(() => mockClient);

// Use the real isJamBffError function.
export const isJamBffError = jest.fn((err) => (
  jest.requireActual('../errors').isJamBffError(err)
));
