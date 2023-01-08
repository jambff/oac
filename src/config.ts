export type OpenApiClientEnv = 'staging' | 'production';

type BaseUrls = {
  staging: string;
  production: string;
};

const BASE_URLS: BaseUrls = {
  staging: 'https://example.staging-api.co.uk',
  production: 'https://example.api.co.uk',
};

export const getBaseUrl = (env?: OpenApiClientEnv, baseURL?: string) => {
  if (baseURL) {
    return baseURL;
  }

  if (!env) {
    throw new Error('Either a `baseURL` or an `env` must be given');
  }

  if (!(env in BASE_URLS)) {
    throw new Error(`Not a known \`env\`: ${env}`);
  }

  return BASE_URLS[env];
};
