# Mobile Conversion Migration Report

## Overview
- Converted the web frontend to a React Native (Expo) mobile app located at `mobile-app/`.
- Implemented authentication flows and role-based dashboard stubs.
- Preserved API base URL alignment with the web app.

## Environment & Config
- Mobile app API base: `app.json -> extra.MOBILE_API_URL` set to `https://totalreconditiontracking.com/api`.
- `src/constants/config.js` normalizes `MOBILE_API_URL` to ensure no duplicate `/api` or trailing slashes.
- Web `.env` previously at repo root moved to `web-backup/.env`.

## Navigation
- Wired `AppNavigator` into `mobile-app/App.js` and configured `StatusBar`.
- `LoginSelectionScreen` passes role to `Login` via `navigation.navigate('Login', { role })`.

## Auth Screens Implemented
- `mobile-app/src/screens/auth/LoginScreen.js` — login with role support, password visibility toggle, API call via `authAPI.login`, persists `userEmail` and `userRole` to `AsyncStorage`, navigates to role dashboards.
- `mobile-app/src/screens/auth/SignupScreen.js` — signup with OTP request/verification and resend flow using existing `authAPI` endpoints.
- `mobile-app/src/screens/auth/ForgotPasswordScreen.js` — OTP request/verification and password reset using existing `authAPI` endpoints.

## Dashboard & Shared Screens
- Admin: `mobile-app/src/screens/admin/AdminDashboardScreen.js`.
- Contractor: `mobile-app/src/screens/contractor/ContractorDashboardScreen.js`.
- Technician: `mobile-app/src/screens/technician/TechnicianDashboardScreen.js`.
- Supplier: `mobile-app/src/screens/supplier/SupplierDashboardScreen.js`.
- Consultant: `mobile-app/src/screens/consultant/ConsultantDashboardScreen.js`.
- Logs: `mobile-app/src/screens/shared/LogsScreen.js`.
- Reports: `mobile-app/src/screens/shared/ReportsScreen.js`.
- User Management (admin route target): `mobile-app/src/screens/admin/UserManagementScreen.js`.

## Dependencies
- Installed Expo web support packages: `react-dom` and `react-native-web` in `mobile-app`.
- Verified `npm install` succeeded in `mobile-app/`.

## Web Preview
- Started Expo Web on `http://localhost:8080/`.
- Use this URL to validate navigation and auth flows in the browser.

## Web Frontend Relocation
- Created `web-backup/` folder and moved web assets:
  - `web-backup/.env`
  - `web-backup/eslint.config.js`
  - `web-backup/postcss.config.js`
  - `web-backup/vite.config.js`
  - `web-backup/index.html`
  - `web-backup/src/`
  - `web-backup/public/`
  - `web-backup/dist/`
  - `web-backup/package.json`
  - `web-backup/package-lock.json`

## Next Steps
- Flesh out role-specific dashboards to mirror web functionality.
- Port shared components/utilities where relevant (tables, filters, forms).
- Integrate deeper navigation stacks and tabs per role.
- Add unit tests for auth flows and navigation.