# Mobile Attendance Flow

## Start

1. `GET /api/v1/dashboard/me`
2. Read today's shift and attendance status.
3. Ask OS permissions for camera and location.
4. Collect GPS, accuracy, optional WiFi SSID/BSSID, and face image/reference.

## Check-In

`POST /api/v1/attendance/check-in`

Payload includes:

- `workDate`
- `latitude`
- `longitude`
- `wifiSsid`
- `wifiBssid`
- `faceImage`

Success returns current attendance record in the standard response wrapper.

## Check-Out

`POST /api/v1/attendance/check-out`

Payload includes location. Success returns updated attendance record.

## Error Codes

- `SHIFT_ASSIGNMENT_NOT_FOUND`
- `TOO_EARLY_TO_CHECK_IN`
- `OUTSIDE_ATTENDANCE_RADIUS`
- `INVALID_WIFI`
- `FACE_VERIFICATION_FAILED`
- `ALREADY_CHECKED_IN`
- `NOT_CHECKED_IN`
- `ALREADY_CHECKED_OUT`

Frontend should map each code to a specific UI message, not a generic network error.
