# Cloud Storage App

This repository contains a full-stack cloud storage application with:

- Backend API server in `backend/`
- Frontend React app in `frontend/web/`
- Local MinIO object storage integration
- MongoDB database storage
- Gmail SMTP email verification
- Cloudinary avatar upload support

---

## Repository Structure

- `backend/` - Node.js/Express backend
- `frontend/web/` - React + Vite frontend
- `frontend/mobile/` - mobile app folder (not documented here)

---

## Backend

### Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy or create `.env` in `backend/` with required values.

3. Run backend in development:
   ```bash
   npm run dev
   ```

4. Production start:
   ```bash
   npm start
   ```

### Required Environment Variables

Backend uses `dotenv` and requires these values in `backend/.env`:

- `PORT` - server port (default `5000`)
- `MONGO_URI` - MongoDB connection string
- `CLIENT_URL` - frontend host for CORS
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRE` - JWT expiration, e.g. `1d`
- `MINIO_ENDPOINT` - MinIO host (`127.0.0.1`)
- `MINIO_PORT` - MinIO port (`9000`)
- `MINIO_USE_SSL` - `true` or `false`
- `MINIO_ACCESS_KEY` - MinIO root/access key
- `MINIO_SECRET_KEY` - MinIO secret key
- `MINIO_BUCKET` - default bucket name, e.g. `users`
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SMTP_HOST` - SMTP host, e.g. `smtp.gmail.com`
- `SMTP_PORT` - SMTP port, e.g. `587`
- `SMTP_SECURE` - `true` for TLS 465, `false` for 587
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password/app password
- `EMAIL_FROM` - sender address for emails

> Do not commit secrets. Use placeholders or a `.env.example` if needed.

### Backend Scripts

- `npm run dev` - start backend with `nodemon`
- `npm start` - start backend with `node server.js`

### Backend Server

- Express app is configured in `backend/src/app.js`
- Routes are mounted under `/api`
- Health check endpoints:
  - `GET /health`
  - `GET /`

### Main Backend APIs

#### Auth

- `POST /api/auth/register` - user registration
- `POST /api/auth/login` - user login
- `POST /api/auth/refresh` - refresh access token
- `POST /api/auth/logout` - logout
- `GET /api/auth/profile` - get auth user profile
- `PUT /api/auth/profile` - update auth user profile
- `PUT /api/auth/change-password` - change password
- `DELETE /api/auth/delete-account` - delete account
- `POST /api/auth/restore-account` - restore deleted account

#### User / Profile

- `POST /api/users/profile/avatar` - upload user avatar
- `GET /api/users/profile` - get profile data
- `PUT /api/users/profile` - update profile data
- `POST /api/users/verify-email/send` - send email verification OTP
- `POST /api/users/verify-email/confirm` - verify OTP
- `POST /api/users/verify-email/resend` - resend OTP

#### Folders

- `POST /api/folders` - create folder
- `GET /api/folders` - list root folders
- `GET /api/folders/trash` - list trashed folders
- `DELETE /api/folders/trash/empty` - empty folder trash
- `GET /api/folders/:folderId` - get folder contents
- `PUT /api/folders/:folderId` - rename folder
- `PUT /api/folders/:folderId/rename` - rename folder (alias)
- `PUT /api/folders/:folderId/move` - move folder
- `DELETE /api/folders/:folderId` - delete folder
- `PUT /api/folders/:folderId/restore` - restore folder from trash
- `DELETE /api/folders/:folderId/permanent` - permanently delete folder

#### Files

- `POST /api/files/upload` - upload file
- `GET /api/files` - list files
- `GET /api/files/recent` - recent files
- `GET /api/files/starred` - starred files
- `GET /api/files/trash` - trashed files
- `GET /api/files/storage-metrics` - file storage metrics
- `DELETE /api/files/trash/empty` - empty file trash
- `GET /api/files/:fileId` - get file metadata
- `GET /api/files/:fileId/download` - download file
- `POST /api/files/:fileId/copy` - copy file
- `PUT /api/files/:fileId/rename` - rename file
- `PUT /api/files/:fileId/move` - move file
- `PUT /api/files/:fileId/star` - toggle file star
- `DELETE /api/files/:fileId` - delete file
- `PUT /api/files/:fileId/restore` - restore file
- `DELETE /api/files/:fileId/permanent` - permanently delete file

#### Share

- `POST /api/share` - create share
- `POST /api/share/file/:id` - share file by ID
- `POST /api/share/folder/:id` - share folder by ID
- `GET /api/share/shared-with-me` - resources shared with current user
- `GET /api/share` - list current user shares
- `GET /api/share/:shareToken/resource` - get shared resource metadata
- `GET /api/share/:shareToken/download` - download shared file
- `PUT /api/share/:shareId/permission` - update share permission
- `DELETE /api/share/:shareId` - revoke share

#### Upload helper route

- `POST /api/upload/upload` - file upload helper route

#### Notifications

- `GET /api/notifications` - list notifications
- `PUT /api/notifications/read-all` - mark all read
- `PUT /api/notifications/:id/read` - mark notification read
- `DELETE /api/notifications/clear` - clear all notifications
- `DELETE /api/notifications/:id` - delete notification
- `GET /api/notifications/unread-count` - unread count

#### Storage

- `GET /api/storage/status` - get storage usage for current user

#### Billing

- `GET /api/billing/plans` - fetch available plans
- `GET /api/billing/summary` - billing summary
- `POST /api/billing/upgrade` - upgrade plan

#### Support

- `POST /api/support/ticket` - create support ticket
- `GET /api/support/tickets` - list tickets
- `GET /api/support/ticket/:id` - get ticket details
- `PATCH /api/support/ticket/:id/reopen` - reopen ticket
- `POST /api/support/ticket/:id/messages` - add ticket message

### Notes on Email Verification

- Email verification is implemented in `backend/src/controllers/user.controller.js`
- Verification flow:
  1. `POST /api/users/verify-email/send` sends OTP to user email
  2. `POST /api/users/verify-email/confirm` confirms OTP
  3. `POST /api/users/verify-email/resend` resends OTP
- SMTP is configured in `backend/src/config/mail.js`

### MinIO and Storage

- MinIO is started by `backend/startMinio.js`
- MinIO root credentials are derived from `.env`
- The backend MinIO client is configured in `backend/src/config/minio.js`
- Default bucket is defined by `MINIO_BUCKET`

---

## Frontend

### Setup

1. Install frontend dependencies:
   ```bash
   cd frontend/web
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build production bundle:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

### Frontend Environment

- `VITE_API_URL` - backend API base URL, e.g. `http://localhost:5000/api`
- `VITE_API_TIMEOUT` - request timeout in ms
- `VITE_API_RETRIES` - automatic retry count for network failures

### Frontend API Clients

The frontend uses `frontend/web/src/api/apiClient.js` and the following API wrappers:

- `authApi` - auth routes
- `userApi` - profile, avatar upload, email verification
- `fileApi` - file listing, upload, download, rename, move, star, trash
- `folderApi` - folder operations
- `shareApi` - sharing operations
- `notificationApi` - notifications
- `billingApi` - billing routes
- `supportApi` - support ticket flow

### Key Frontend Features

- Auto-refreshes access token on 401 via `/auth/refresh`
- Sends JSON payloads and handles `FormData` for uploads
- Uses credentials cookies via `withCredentials: true`

---

## Full API Verification Notes

- All backend routes are registered under `/api`
- Authentication and profile routes require JWT protect middleware where declared
- `GET /health` and `GET /` are public health checks
- File and folder uploads use multipart `FormData`
- Email verification is available under `/api/users/verify-email/*`

---

## Useful Paths

- Backend server: `backend/server.js`
- Backend routes: `backend/src/routes/`
- Backend controllers: `backend/src/controllers/`
- Backend config: `backend/src/config/`
- Frontend API clients: `frontend/web/src/api/`
- Frontend entry: `frontend/web/src/main.jsx`

---

## Notes

- Check `backend/.env` for private credentials and replace with secure values.
- `frontend/web/README.md` is a default Vite template file and does not document this app.
- If you need a `.env.example`, copy `backend/.env` and remove personal secrets.
