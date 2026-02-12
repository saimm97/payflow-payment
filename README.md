# PayFlow — Professional Payment Application

A full-featured web payment application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **NextAuth**, with solid code practices and a clear structure.

## Features

### Authentication
- **User registration** — Create an account with name, email, and password (stored hashed with bcrypt).
- **Sign in / Sign out** — Credential-based login; protected routes redirect to login when unauthenticated.

### Profile & security
- **Profile** — Account info, security placeholder, and recent sign-ins (device/location log).
- **Settings** — Default currency and notification preferences.

### Payments & transactions
- **Send payment** — Amount, currency, recipient (saved-recipient picker), description, card details (client-side only).
- **Request payment** — Create requests; list and mark as paid or cancel.
- **Saved recipients** — Add and manage beneficiaries; use on payment form.
- **Transactions** — Table with status filter, search, date range; click row for detail modal.
- **Notifications** — Bell in sidebar; payment success/failure; mark read.

### Dashboard
- **Available balance** — Mock balance card.
- **Stats** — Total sent, transaction count, completed, pending.
- **Recent transactions** — Latest 5; **Activity feed** — Recent payment activity.

### Help & navigation
- **Help & support** — FAQ accordion and contact link.
- **Breadcrumbs** — On transactions, settings, help, requests.
- **404** — Branded not-found page.

### General
- **Validation** — Zod; **Responsive**; **Accessibility** — ARIA and keyboard-friendly.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth.js (Credentials provider, JWT)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Password hashing:** bcryptjs

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth route group (no sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/          # Protected app (sidebar)
│   │   ├── layout.tsx        # AppShell
│   │   ├── page.tsx          # Dashboard home
│   │   ├── pay/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── recipients/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── help/page.tsx
│   │   └── requests/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/register/route.ts
│   │   ├── payments/route.ts
│   │   ├── transactions/route.ts
│   │   ├── recipients/route.ts  (GET, POST) + [id] (DELETE)
│   │   ├── notifications/route.ts (GET, POST, PATCH) + [id] (PATCH)
│   │   ├── settings/route.ts (GET, PATCH)
│   │   ├── requests/route.ts (GET, POST) + [id] (PATCH)
│   │   └── activity/signins/route.ts (GET)
│   ├── globals.css
│   └── layout.tsx
├── components/
├── hooks/
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── auth-store.ts     # In-memory user store
│   ├── recipient-store.ts
│   ├── notification-store.ts
│   ├── money-request-store.ts
│   ├── settings-store.ts
│   ├── signin-log-store.ts
│   ├── payment-service.ts
│   └── validation.ts
├── types/
└── middleware.ts         # Protects dashboard routes
```

## Getting Started

1. **Install dependencies**

   ```bash
   cd payment-app && npm install
   ```

2. **Environment (optional for dev)**

   Copy `.env.example` to `.env` and set:
   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXTAUTH_SECRET` — any random string for production

   The app runs without these in dev (default secret used).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to **Login**. Use **Create one** to go to **Register**, then sign in and use the dashboard.

## Scripts

| Command       | Description            |
|---------------|------------------------|
| `npm run dev` | Start dev server       |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint`  | Run ESLint           |

## Production Notes

- Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in production.
- Replace in-memory stores (`auth-store`, `recipient-store`, `payment-service`) with a database.
- Use a real payment provider (e.g. Stripe); never log or store full card numbers.
- Add rate limiting and CSRF protection.
