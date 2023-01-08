// @ts-ignore
import type { components } from './types';

// @ts-ignore
export * from './client';
export { isOpenApiClientError, OpenApiClientError } from './errors';
export { createOpenApiClient, OpenApiClientOptions } from './create';

export type ApiModels = components['schemas'];
