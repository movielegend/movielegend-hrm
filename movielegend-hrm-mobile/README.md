# MovieLegend HRM Mobile

Frontend mobile mới cho hệ thống MovieLegend HRM. Project dùng Expo, React Native, TypeScript strict, Expo Router, TanStack Query, Axios, SecureStore, Socket.IO client, React Hook Form và Zod.

## Node Version

Khuyến nghị dùng Node.js LTS mới. Kiểm tra:

```bash
node -v
npm -v
```

## Cài Đặt

```bash
npm install
```

## Env

Tạo file `.env` local từ `.env.example`:

```bash
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SOCKET_URL=
```

Ví dụ LAN development:

```bash
EXPO_PUBLIC_API_URL=http://<LAN_IP>:3001/api/v1
EXPO_PUBLIC_SOCKET_URL=http://<LAN_IP>:3001
```

Không đưa JWT secret, database URL hoặc backend credential vào frontend env.

## Chạy Expo

```bash
npx expo start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Trên Windows, iOS nên chạy qua Expo Go hoặc build trên macOS.

## API URL

Mobile luôn đọc backend URL từ:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SOCKET_URL`

Source code không hard-code `localhost`, `127.0.0.1` hoặc IP LAN. Khi test trên thiết bị thật, dùng IP LAN của máy chạy backend. Staging/production chỉ cần thay env tương ứng.

## Auth Architecture

`AuthProvider` là nơi duy nhất quản lý phiên đăng nhập:

- đọc token từ `expo-secure-store`;
- gọi `/auth/me` để restore session;
- gọi `/auth/login`;
- gọi `/auth/refresh`;
- gọi `/auth/logout`;
- expose `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `refreshSession()`, `reloadProfile()`.

Screen không tự xử lý token.

## Token Refresh Strategy

Axios instance trong `src/api/client.ts` gắn access token qua request interceptor. Khi response trả `401`, client:

1. retry mỗi request tối đa một lần;
2. dùng single-flight refresh để nhiều request song song chỉ gọi `/auth/refresh` một lần;
3. lưu access/refresh token mới vào SecureStore;
4. retry request ban đầu;
5. nếu refresh fail thì clear token và đưa app về trạng thái chưa đăng nhập.

## Role Routing

Backend trả `roles` dạng array. Route priority:

1. `ADMIN` -> `/admin`
2. `HR` -> `/admin`
3. `ACCOUNTANT` -> `/admin`
4. `WAREHOUSE_MANAGER` -> `/admin`
5. `LEADER` -> `/leader`
6. `EMPLOYEE` -> `/employee`

Quy tắc nằm trong `src/utils/role-routing.ts`.

## Dashboard Shell

Dashboard ban đầu chỉ chứng minh luồng end-to-end:

- Admin gọi `/dashboard/admin`;
- Leader gọi `/dashboard/leader`;
- Employee gọi `/dashboard/me`;
- render card cơ bản từ dữ liệu thật backend trả về.

Các module Attendance, Task, Payroll, Warehouse, Contract và KPI chưa được xây trong phase này.

## Kiểm Tra

```bash
npx expo-doctor
npx tsc --noEmit
npm run test
```

## Phase 2 Mobile

Phase 2 adds mobile screens and API adapters for:

- public employee registration with account info, profile info, department selection, face capture, review and submit;
- account approvals list/detail with approve/reject actions;
- admin employee list/detail/basic edit;
- leader employee list through the backend-scoped `/reports/employees` endpoint;
- department list/detail/create/update;
- leader assignment through `/admin/leader-assignments`;
- permission-aware dashboard navigation using backend permissions only.

The mobile app does not create a role system and does not expand permissions locally. All permission checks use the authenticated user's `permissions` array returned by backend auth endpoints.

Integration Gate updates:

- Position list now uses real `GET /positions` with optional `departmentId`, `isActive`, `search`, `page`, and `limit`.
- Face registration now uploads each pose to `POST /uploads` with `purpose=FACE_REGISTRATION`, then submits `fileId` and `fileUrl` in `/auth/register`.
- Mobile does not keep base64 face images in registration state.
- Upload retry is per pose; a failed LEFT upload can be retried without recapturing FRONT and RIGHT while the local URI is still available.
- Leader employee detail remains blocked because `/reports/employees` returns report rows without a stable employee/user id for detail navigation.

Upload policy used by mobile:

- `FACE_REGISTRATION`: `image/jpeg`, `image/png`, `image/webp`, max 3 MB.
- Backend may return `UPLOAD_FILE_TOO_LARGE`, `UPLOAD_MIME_NOT_ALLOWED`, `UPLOAD_SIGNATURE_INVALID`, `UPLOAD_UNAUTHORIZED`, `UPLOAD_NOT_FOUND`, or `UPLOAD_ALREADY_ATTACHED`.
