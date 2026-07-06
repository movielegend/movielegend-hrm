# Face Flow

## Registration

Registration requires three face poses:

- `FRONT`
- `LEFT`
- `RIGHT`

The backend stores a face profile with status:

- `PENDING`
- `APPROVED`
- `REJECTED`

Frontend should show whether the account has face data and the approval status after `/auth/me`.

## Attendance

Check-in sends one attendance face image/reference with GPS and optional WiFi metadata.

Main errors:

- `FACE_VERIFICATION_FAILED`
- `SHIFT_ASSIGNMENT_NOT_FOUND`
- `TOO_EARLY_TO_CHECK_IN`
- `OUTSIDE_ATTENDANCE_RADIUS`
- `INVALID_WIFI`

## Frontend UI States

- Missing face profile: guide user to registration/support.
- Pending face profile: block attendance until approval policy allows.
- Rejected face profile: show rejection guidance.
- Approved face profile: allow check-in flow.
