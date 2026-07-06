# Upload Contract

MovieLegend HRM exposes one centralized binary upload endpoint:

```http
POST /api/v1/uploads
Content-Type: multipart/form-data
```

Fields:

- `file`: one binary file.
- `purpose`: one of `FACE_REGISTRATION`, `ATTENDANCE`, `TASK_ATTACHMENT`, `EMPLOYEE_DOCUMENT`, `CONTRACT_TEMPLATE`, `SIGNATURE`, `KPI_EVIDENCE`, `ASSET_INCIDENT`.

Success response:

```json
{
  "success": true,
  "data": {
    "fileUrl": "/uploads/face_registration/2026-07-05/random.jpg",
    "fileId": "uuid",
    "mimeType": "image/jpeg",
    "size": 123456,
    "purpose": "FACE_REGISTRATION"
  }
}
```

The API never returns an absolute local filesystem path.

## Authorization

`FACE_REGISTRATION` is allowed without JWT so public registration can upload FRONT, LEFT and RIGHT images before account creation.

All other purposes require a valid access token and `upload.create`.

## Purpose Policy

| Purpose | MIME allowlist | Extensions | Max size |
| --- | --- | --- | --- |
| `FACE_REGISTRATION` | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` | 3 MB |
| `ATTENDANCE` | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` | 3 MB |
| `TASK_ATTACHMENT` | image, PDF, DOCX, XLSX | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.docx`, `.xlsx` | 10 MB |
| `EMPLOYEE_DOCUMENT` | image, PDF | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` | 10 MB |
| `CONTRACT_TEMPLATE` | PDF, DOCX | `.pdf`, `.docx` | 10 MB |
| `SIGNATURE` | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` | 1 MB |
| `KPI_EVIDENCE` | image, PDF | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` | 10 MB |
| `ASSET_INCIDENT` | image, PDF | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` | 10 MB |

## Security

- Only one `file` part is accepted.
- Unknown or nested multipart fields are rejected.
- `Content-Length` and parsed file size are checked.
- MIME header, file extension, and file signature are validated.
- Executable uploads are not allowed.
- Client filenames are sanitized and are not trusted for storage paths.
- Server storage keys are random UUID paths grouped by purpose/date.
- Local development storage writes under `STORAGE_LOCAL_ROOT`; production rejects the local driver.
- Business modules must not write files directly. They should consume `fileId`/`fileUrl` returned by this endpoint and store references in their own DTOs.

## Registration Face Flow

Mobile captures each pose and uploads sequentially:

1. Capture `FRONT`, upload with `purpose=FACE_REGISTRATION`, store `fileId` and `fileUrl`.
2. Capture `LEFT`, upload.
3. Capture `RIGHT`, upload.
4. Submit `/auth/register` with `faceImages[]` containing `pose`, `fileId`, and `imageUrl`.

If any upload fails, retry only that pose while the local URI still exists.

## Metadata

Uploaded files are stored in `uploaded_files`:

- `id`
- `uploadedById`
- `purpose`
- `fileName`
- `storageKey`
- `fileUrl`
- `mimeType`
- `size`
- `checksum`
- `status`: `TEMPORARY`, `ATTACHED`, `DELETED`
- `createdAt`
- `deletedAt`

Registration marks the three temporary face files as `ATTACHED` inside the register transaction.

## Cleanup

Temporary files that remain unattached are cleanup candidates. `UploadsService.cleanupExpiredTemporaryFiles(olderThan)` deletes the storage object and marks metadata as `DELETED`. Production should schedule this through the jobs layer.
