import { JamBffError } from '../src/errors';
import { getAuthorizationHeader } from '../src/auth';
import { generateAccessToken } from './utils';

const generateFreshAccessToken = (claims?: {}) => {
  const timeNow = new Date().getTime() / 1000;

  return generateAccessToken({ ...claims, exp: timeNow + 1 });
};

const generateExpiredAccessToken = (claims?: {}) => {
  const timeNow = new Date().getTime() / 1000;

  return generateAccessToken({ ...claims, exp: timeNow - 1 });
};

describe('Auth', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  it('appends an access token for secure routes', async () => {
    const accessToken = generateFreshAccessToken();
    const getAccessToken = () => accessToken;
    const auth = await getAuthorizationHeader(true, getAccessToken);

    expect(auth).toBe(`Bearer ${accessToken}`);
  });

  it('does nothing if the route is not secure and no getAccessToken function is provided', async () => {
    const auth = await getAuthorizationHeader(false);

    expect(auth).toBeNull();
  });

  it.each([
    undefined,
    'some-other-role',
  ])('does not append an access token for unsecure routes if user roles equals %s', async (role) => {
    const accessToken = generateFreshAccessToken({ role });
    const getAccessToken = () => accessToken;
    const auth = await getAuthorizationHeader(false, getAccessToken);

    expect(auth).toBeNull();
  });

  it('throws for secure routes if no getAccessToken function was given', async () => {
    let err;

    try {
      await getAuthorizationHeader(true);
    } catch (error) {
      err = error;
    }

    expect((err as JamBffError).statusCode).toBe(401);
    expect((err as JamBffError).name).toBe('JamBffError');
    expect((err as JamBffError).message).toBe(
      'Authorization is required but no `getAccessToken()` function was provided.',
    );
  });

  it.each([
    null,
    'no good',
  ])('throws for secure routes if getAccessToken returns "%s" and refreshAccessToken not given', async (accessToken) => {
    const getAccessToken = () => accessToken;
    let err;

    try {
      await getAuthorizationHeader(true, getAccessToken);
    } catch (error) {
      err = error;
    }

    expect((err as JamBffError).statusCode).toBe(401);
    expect((err as JamBffError).name).toBe('JamBffError');
    expect((err as JamBffError).message).toBe(
      'Authorization is required but there is no valid access token and no `refreshAccessToken()` function was provided.',
    );
  });

  it('throws for secure routes if getAccessToken and refreshAccessToken return no tokens', async () => {
    const getAccessToken = () => null;
    const refreshAccessToken = () => null;
    let err;

    try {
      await getAuthorizationHeader(true, getAccessToken, refreshAccessToken);
    } catch (error) {
      err = error;
    }

    expect((err as JamBffError).statusCode).toBe(401);
    expect((err as JamBffError).name).toBe('JamBffError');
    expect((err as JamBffError).message).toBe(
      'Authorization is required but there is no valid access token and nothing was returned from `refreshAccessToken()`.',
    );
  });

  it('refreshes the access token if it has expired', async () => {
    const expiredAccessToken = generateExpiredAccessToken();
    const freshAccessToken = generateFreshAccessToken();
    const getAccessToken = () => expiredAccessToken;
    const refreshAccessToken = () => freshAccessToken;
    const auth = await getAuthorizationHeader(true, getAccessToken, refreshAccessToken);

    expect(auth).toBe(`Bearer ${freshAccessToken}`);
  });

  it('throws for secure routes if refreshAccessToken returns an expired token', async () => {
    const expiredAccessToken = generateExpiredAccessToken();
    const getAccessToken = () => null;
    const refreshAccessToken = () => expiredAccessToken;
    let err;

    try {
      await getAuthorizationHeader(true, getAccessToken, refreshAccessToken);
    } catch (error) {
      err = error;
    }

    expect((err as JamBffError).statusCode).toBe(401);
    expect((err as JamBffError).name).toBe('JamBffError');
    expect((err as JamBffError).message).toBe(
      'Authorization is required but the access token has expired and `refreshAccessToken()` also returned an expired token.',
    );
  });

  it('does not throw if an access token has expired for an admin user but the route is not secure anyway', async () => {
    const expiredAccessToken = generateExpiredAccessToken({ role: 'wp-admin' });
    const getAccessToken = () => expiredAccessToken;
    const refreshAccessToken = () => expiredAccessToken;

    const auth = await getAuthorizationHeader(false, getAccessToken, refreshAccessToken);

    expect(auth).toBeNull();
  });
});
