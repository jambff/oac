import { getOapiSpec } from '@jambff/api';
import { getTypeScriptReader, getJsonSchemaWriter, makeConverter } from 'typeconv';
import path from 'path';
import assert from 'assert';
import { pascalCase } from 'pascal-case';
import openapiTS from 'openapi-typescript';
import { compileTemplate } from './compile-template';
import { writeFile } from './write-file';
import { SRC_DIR, TEMPLATES_DIR } from './constants';

/**
 * Format a JSON Schema title as a TypeScript refererence.
 *
 * The JSON schema titles look something like:
 * operations."SearchController.post".responses.200.content."application/json"
 *
 * The type ref in the generated file looks like:
 * operations['"SearchController.post"']['responses']['200']['content']['"application/json"']
 */
const formatJsonSchemaTitleAsType = (jsonSchemaTitle) => {
  const parts = jsonSchemaTitle.split('.');
  const fixedParts = [];

  // Rejoin any parts like "SearchController.post"
  parts.forEach((part, index) => {
    if (part.endsWith('"') && !part.startsWith('"')) {
      fixedParts[index - 1] = `${fixedParts[index - 1]}.${part}`;

      return;
    }

    fixedParts.push(part);
  });

  return fixedParts
    .map((part) => part.replace(/^"/, '').replace(/"$/, ''))
    .map((part, index) => (index ? `['${part}']` : part))
    .join('');
};

/**
 * Build up a reference to one of our types from a content schema.
 */
const getTypeReferenceFromJson = (content) => {
  if (!content) {
    return 'undefined';
  }

  const jsonKey = '"application/json"';

  if (!(jsonKey in content.properties)) {
    throw new Error('No "application/json: content found');
  }

  const { title } = content.properties[jsonKey] || {};

  if (!title) {
    throw new Error('No component reference found');
  }

  return formatJsonSchemaTitleAsType(title);
};

/**
 * Build up a reference to one of our types for the function response.
 */
const getFunctionResponseType = (operationId, operationSchema) => {
  const { responses } = operationSchema.properties || {};

  if (!responses) {
    throw new Error(`No responses were defined for operation ID "${operationId}".`);
  }

  const successStatusCodes = Object.keys(responses.properties).filter((statusCode) => (
    statusCode.startsWith('2')
  ));

  if (!successStatusCodes.length) {
    throw new Error(`No success responses were defined for operation ID "${operationId}".`);
  }

  if (successStatusCodes.length > 1) {
    throw new Error(`Multiple success responses were defined for operation ID "${operationId}".`);
  }

  const [successStatusCode] = successStatusCodes;
  const { content } = responses.properties[successStatusCode].properties || {};

  try {
    return getTypeReferenceFromJson(content);
  } catch (err) {
    throw new Error(`Invalid success responses schema was defined for operation ID "${operationId}": ${err.message}.`);
  }
};

/**
 * Build up a reference to one of our types for the request body, if any.
 */
const getDataType = (operationId, operationSchema) => {
  const { requestBody } = operationSchema.properties || {};

  if (!requestBody) {
    return null;
  }

  try {
    return getTypeReferenceFromJson(requestBody.properties.content);
  } catch (err) {
    throw new Error(`Invalid request body schema was defined for operation ID "${operationId}": ${err.message}.`);
  }
};

/**
 * Build up a reference to one of our types for the parameters, if any.
 */
const getParametersType = (operationId, operationSchema, subType) => {
  const { parameters } = operationSchema.properties || {};

  if (!((parameters || {}).properties || {})[subType]) {
    return null;
  }

  return `operations['${operationId}']['parameters']['${subType}']`;
};

/**
 * Build up a reference to one of our types for the parameters, if any.
 */
const hasRequiredParametersType = (operationSchema, subType) => {
  const { parameters } = operationSchema.properties || {};

  if (!((parameters || {}).properties || {})[subType]) {
    return false;
  }

  return (parameters.properties[subType].required || []).length > 0;
};

/**
 * Get the core details about the API's operations.
 */
const getFlatOperations = ({ paths }, jsonSchemaTypes) => Object
  .entries(paths)
  .reduce((acc, [endpoint, endpointConfig]) => [
    ...acc,
    ...Object.entries(endpointConfig).map(([method, methodConfig]) => {
      const { operationId } = methodConfig;
      const operationSchema = jsonSchemaTypes.definitions.operations.properties[operationId];
      const dataTypeRef = getDataType(operationId, operationSchema);
      const pathParametersTypeRef = getParametersType(operationId, operationSchema, 'path');
      const queryParametersTypeRef = getParametersType(operationId, operationSchema, 'query');
      const hasRequiredQueryParameters = hasRequiredParametersType(operationSchema, 'query');

      return {
        endpoint,
        method,
        operationId,
        secure: !!(methodConfig.security || []).length,
        hasOptions: pathParametersTypeRef || queryParametersTypeRef || dataTypeRef,
        responseTypeRef: getFunctionResponseType(operationId, operationSchema),
        dataTypeRef,
        pathParametersTypeRef,
        queryParametersTypeRef,
        responseTypeName: pascalCase(`${operationId}Response`),
        optionsTypeName: pascalCase(`${operationId}Options`),
        queryParametersTypeName: pascalCase(`${operationId}QueryParameters`),
        pathParametersTypeName: pascalCase(`${operationId}PathParameters`),
        dataTypeName: pascalCase(`${operationId}Data`),
        hasRequiredQueryParameters,
        summary: methodConfig.summary,
        description: methodConfig.description,
        tags: methodConfig.tags,
        parameters: methodConfig.parameters,
      };
    }),
  ], []);

/**
 * Build a file that defines the API client functions.
 */
const buildClientFile = async (operations, operationsResponses, operationsOptions) => {
  const fileName = 'client.ts';
  const templatePath = path.join(TEMPLATES_DIR, `${fileName}.tmpl`);
  const outPath = path.join(SRC_DIR, fileName);

  await compileTemplate(templatePath, outPath, {
    operations,
    operationsResponses,
    operationsOptions,
  });
};

/**
 * Build the types file, generated from the OpenAPI spec.
 */
const buildTypesFile = async (types) => {
  const outPath = path.join(SRC_DIR, 'types.ts');
  const content = `/* eslint-disable */\n${types}`;

  writeFile(outPath, content);
};

/**
 * Convert the TS to a JSON schema.
 *
 * So we can parse it and discover what's in the code! For example, does a
 * particular operation have any parameters.
 */
const convertTsToJsonSchema = async (ts) => {
  const reader = getTypeScriptReader();
  const writer = getJsonSchemaWriter();
  const { convert } = makeConverter(reader, writer);
  const { data } = await convert({ data: ts });

  return JSON.parse(data);
};

/**
 * Check the API specification is valid
 */
const validateOapiSpec = (oapiSpec, operations) => {
  const { swagger, openapi } = oapiSpec;
  const version = swagger || openapi;
  const versionKey = swagger ? 'swagger' : 'openapi';

  assert.ok(
    version,
    'Expected either the `swagger` or `openapi` properties to exist.',
  );

  assert.ok(
    /^[2-3]\./.test(version),
    `Expected \`${versionKey}\` to be >= 2 and < 4, got "${version}".`,
  );

  const endpointsWithMissingOperationIds = operations
    .filter(({ operationId }) => !operationId)
    .map(({ endpoint }) => endpoint);

  assert.ok(
    !endpointsWithMissingOperationIds.length,
    `Expected all endpoints to have operation IDs: ${endpointsWithMissingOperationIds}.`,
  );

  const operationIds = operations.map(({ operationId }) => operationId);
  const duplicateOperationIds = operationIds.filter((item, index) => (
    operationIds.indexOf(item) !== index
  ));

  assert.ok(
    !duplicateOperationIds.length,
    `Expected operation IDs to be unique but found duplicates: ${duplicateOperationIds}.`,
  );
};

/**
 * Generate all the things.
 */
export const build = async () => {
  const oapiSpec = getOapiSpec();
  const types = await openapiTS(oapiSpec);
  const jsonSchemaTypes = await convertTsToJsonSchema(types);
  const operations = getFlatOperations(oapiSpec, jsonSchemaTypes);
  const operationsResponses = operations.map(({ responseTypeName }) => responseTypeName);
  const operationsOptions = operations
    .filter(({ hasOptions }) => hasOptions)
    .map(({ optionsTypeName }) => optionsTypeName);

  validateOapiSpec(oapiSpec, operations);

  await Promise.all([
    buildClientFile(operations, operationsResponses, operationsOptions),
    buildTypesFile(types),
  ]);
};
