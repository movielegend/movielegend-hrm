# OpenAPI Readiness

## Current Status

- Bearer auth is configured globally.
- Swagger tags cover Phase 1-7 modules.
- `operationIdFactory` is deterministic: `{Controller}_{method}`.
- Request DTOs are decorated with class-validator and Swagger decorators in most modules.
- Success and error wrappers are global runtime behavior.

## Gaps To Track

- Many controllers still return Prisma-shaped entities instead of explicit response DTO classes.
- Some list endpoints are not yet standardized to `{ items, pagination }`.
- Multipart upload schemas are intentionally not enabled because current flows use file metadata URLs.
- Error response schema is enforced by `AllExceptionsFilter`, but OpenAPI does not yet declare a shared error schema on every operation.

## Client Generation Recommendation

Generate a TypeScript client only after:

1. response DTOs are added for high-traffic frontend screens;
2. paginated endpoints share one response schema;
3. upload metadata DTO is shared;
4. common error response schema is added with Swagger decorators.
