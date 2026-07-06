# Security Audit

Date: 2026-07-04

Command run:

```bash
npm audit --json
```

## Summary

- Before safe remediation: 10 high severity vulnerabilities.
- Applied: `npm audit fix` without `--force`.
- After safe remediation and Phase 7 implementation: 7 high severity vulnerabilities.
- No `npm audit fix --force` was run.

## Applied Safe Updates

`npm audit fix` updated patch/minor-compatible packages in the Prisma chain, including Prisma packages from `6.19.0` to `6.19.3`. Build and tests must remain the source of truth after this update.

## Remaining Findings

| Package | Direct | Runtime | Severity | Root Cause | Safe Patch/Minor Available | Major/Breaking Required |
| --- | --- | --- | --- | --- | --- | --- |
| `@nestjs/core` | Yes | Yes | High | Affected through `@nestjs/platform-express` and `@nestjs/websockets` | No | Yes, audit suggests `@nestjs/core@7.5.5` |
| `@nestjs/platform-express` | Yes | Yes | High | Depends on vulnerable `multer` chain | No | Yes, audit suggests breaking Nest downgrade |
| `@nestjs/platform-socket.io` | Yes | Yes | High | Affected through `@nestjs/websockets` | No | Yes, audit suggests `7.6.18` |
| `@nestjs/swagger` | Yes | Runtime/docs | High | Affected through `@nestjs/core` | No | Yes, audit suggests `5.0.8` |
| `@nestjs/testing` | Yes | Dev-only | High | Affected through `@nestjs/core` and platform express | No | Yes, audit suggests `7.5.5` |
| `@nestjs/websockets` | No | Yes | High | Transitive from Socket.IO platform | No | Yes |
| `multer` | No | Runtime if multipart upload is enabled | High | DoS via nested field names; cleanup issue on aborted uploads | No compatible fix through current Nest tree | Yes |

## Risk Notes

- The remaining issue is concentrated in the Nest platform/multer dependency chain.
- Current Phase 6 endpoints do not implement multipart upload; document, contract, signature, and KPI evidence fields accept metadata URLs rather than uploaded binary payloads.
- If multipart upload is added later, enforce file size, field count, and nested field limits at the adapter level before enabling public upload endpoints.
- A forced audit fix would downgrade/change major Nest packages and is not safe without a planned framework compatibility pass.

## Recommendation

Track NestJS releases that resolve the `multer` advisory without a breaking downgrade. Re-run:

```bash
npm audit --json
npm run build
npm run test
npm run test:e2e
```

before any production deployment that changes framework dependencies.

## Phase 5 Decision

Phase 5 did not run `npm audit fix --force` and did not change Nest major versions. The remaining findings still require a breaking framework change according to npm audit, so the decision is to keep the current dependency line, document the risk, and avoid enabling multipart upload endpoints without explicit limits and a planned Nest/multer remediation.

## Phase 6 Decision

Phase 6 also did not run `npm audit fix --force`. Employee document, contract, signature, and KPI evidence APIs use storage references/metadata and do not enable multipart upload parsing in Nest. The remaining 7 high severity findings are still tracked for a planned framework dependency remediation rather than an unsafe forced downgrade/major change.

## Phase 7 Decision

Phase 7 did not run `npm audit fix --force`. The 7 remaining high findings are classified as:

- Runtime direct: `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`, `@nestjs/swagger`.
- Runtime transitive: `@nestjs/websockets`, `multer`.
- Dev direct: `@nestjs/testing`.

Reachability and mitigation:

- `multer` is not reachable through Phase 7 because exports return generated payloads and no multipart upload endpoint was added.
- Socket.IO remains runtime reachable, but the namespace requires JWT and emits metadata-only events.
- The available npm fix path still proposes breaking Nest package changes. No safe patch/minor-only remediation is available from the current audit output.
- Mitigations remain strict auth guards, no raw file upload parsing, CORS production validation, request logging without sensitive headers, and avoiding `audit fix --force` until a planned Nest dependency upgrade is tested.

## Phase 8 Package Tree Detail

| Package | Version line | Advisory | Direct/Transitive | Runtime/Dev | Reachability | Available fix | Breaking impact | Mitigation | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `@nestjs/core` | `^11.0.1` | npm audit high via platform packages | Direct | Runtime | Reachable | audit suggests `7.5.5` | Breaking downgrade | Keep current Nest 11; test planned framework upgrade path only | No force |
| `@nestjs/platform-express` | `^11.0.1` | high via `multer` and core | Direct | Runtime | Express runtime reachable; multipart routes not enabled | audit suggests breaking package path | Breaking downgrade | No binary multipart upload endpoints; metadata URL upload contract | No force |
| `@nestjs/platform-socket.io` | `^11.1.27` | high via websockets | Direct | Runtime | Socket namespace reachable with JWT | audit suggests `7.6.18` | Breaking downgrade | JWT handshake, scoped rooms, metadata-only events | No force |
| `@nestjs/swagger` | `^11.4.5` | high via core | Direct | Runtime/docs | Swagger route reachable | audit suggests `5.0.8` | Breaking downgrade | Keep behind operational controls in deployment if needed | No force |
| `@nestjs/testing` | `^11.0.1` | high via core/platform | Direct | Dev | Not production runtime | audit suggests `7.5.5` | Breaking downgrade | Dev-only package | No force |
| `@nestjs/websockets` | transitive | high via core/socket platform | Transitive | Runtime | Socket namespace reachable with auth | audit suggests core downgrade | Breaking downgrade | Authenticated namespace and no sensitive payloads | No force |
| `multer` | transitive | DoS via nested fields, cleanup issue | Transitive | Runtime if multipart enabled | Currently not reachable through app routes | audit suggests breaking Nest path | Breaking downgrade | No multipart routes; upload contract requires size/MIME/file count before future enablement | No force |

Phase 8 added `docs/upload-contract.md` and `docs/integration-audit.md` to document upload hardening and reachability.

## Integration Gate Upload Decision

The new `POST /uploads` endpoint intentionally does not use Nest `FileInterceptor` or Multer. It parses a constrained single-file multipart request in `UploadsService`, rejects unknown/nested fields, applies purpose-specific size/MIME/extension/signature checks, stores metadata in `uploaded_files`, and writes through `StorageService`.

The npm audit report still lists the Nest platform/Multer dependency chain because `@nestjs/platform-express` depends on Multer transitively. The application upload route added in this gate does not call Multer, so the Multer nested-field DoS advisory is not reachable through this endpoint. The remaining package remediation still requires a planned Nest dependency upgrade rather than `npm audit fix --force`.
