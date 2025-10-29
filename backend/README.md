Workshop App - Backend (Email OTP Signup)

Prerequisites
- Node.js 18+
- MySQL 8+
- Gmail App Password (SMTP)

Setup
1) Copy .env.example to .env and fill values.
2) Create a MySQL database and run sql/schema.sql.
3) Install deps: npm install
4) Start dev: npm run dev (port from .env, default 5000)

Endpoints (base: /api)
- POST /auth/request-otp { name, email, password } -> 200 { success, message, resendCooldownSeconds }
- POST /auth/verify-otp { email, otp } -> 201 { success, message, redirect }
- POST /auth/resend-otp { email } -> 200 { success, message, resendCooldownSeconds }

Notes
- Uses bcrypt for OTP and password hashing.
- Limits OTP requests per email and IP (in-memory for dev).
- Do not log secrets/OTPs.

Cleanup
- Manual: npm run cleanup
- This removes expired/used OTPs and pending signups older than 24h.


