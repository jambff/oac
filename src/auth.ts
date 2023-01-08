import decode from 'jwt-decode';
import { JamBffError } from './errors';

type DecodedToken = {
  role?: string | string[];
  exp: number;
}

export type AccessToken = string | null | undefined;

export type TokenRetrieverFunction = () => AccessToken | Promise<AccessToken>;

/**
 * Get a property from the access token.
 */
const getTokenProperty = (accessToken: string, key: keyof DecodedToken) => {
  try {
    return (decode(accessToken) as DecodedToken)[key];
  } catch (err) {
    // Failed to decode token, ignore.
    return null;
  }
};

/**
 * Check if an access token has expired.
 */
const isTokenExpired = (accessToken: string) => {
  const exp = getTokenProperty(accessToken, 'exp');
  const timeNow = new Date().getTime() / 1000;

  return !exp || exp < timeNow;
};

/**
 * Throw a 401 Unauthorized error.
 */
const throwUnauthorizedError = (message: string) => {
  throw new JamBffError(401, message);
};

function assertDefined<T>(
  errorMessage: string,
  value?: T | null,
): asserts value is T {
  if (!value) {
    throwUnauthorizedError(errorMessage);
  }
}

const getRefreshedAccessToken = async (
  refreshAccessToken?: TokenRetrieverFunction,
): Promise<string> => {
  assertDefined(
    'Authorization is required but there is no valid access token and no `refreshAccessToken()` function was provided.',
    refreshAccessToken,
  );

  const refreshedToken = await refreshAccessToken();

  assertDefined(
    'Authorization is required but there is no valid access token and nothing was returned from `refreshAccessToken()`.',
    refreshedToken,
  );

  return refreshedToken;
};

/**
 * Get the bearer authorization header.
 */
export const getAuthorizationHeader = async (
  secure: boolean,
  getAccessToken?: TokenRetrieverFunction,
  refreshAccessToken?: TokenRetrieverFunction,
) => {
  if (secure) {
    assertDefined(
      'Authorization is required but no `getAccessToken()` function was provided.',
      getAccessToken,
    );
  }

  const noop = () => null;
  let accessToken = await (getAccessToken || noop)();

  if (!secure) {
    return null;
  }

  if (!accessToken) {
    accessToken = await getRefreshedAccessToken(refreshAccessToken);
  }

  // If the user is an admin and their token has expired but the route was not
  // secure anyway then we can still go ahead and make the request.
  if (!secure && isTokenExpired(accessToken)) {
    return null;
  }

  if (isTokenExpired(accessToken)) {
    accessToken = await getRefreshedAccessToken(refreshAccessToken);

    if (isTokenExpired(accessToken)) {
      throwUnauthorizedError(
        'Authorization is required but the access token has expired and `refreshAccessToken()` also returned an expired token.',
      );
    }
  }

  return `Bearer ${accessToken}`;
};
