// @ts-ignore
import type { components } from './types';

// @ts-ignore
// eslint-disable-next-line import/no-unresolved
export * from './client';
export { isOpenApiClientError, OpenApiClientError } from './errors';
export { createOpenApiClient, OpenApiClientOptions } from './create';

export type ApiComponents = components['schemas'];
