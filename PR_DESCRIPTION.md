# PR: Stripe integration, dark and light theme, dashboard improvements and other features

## Summary

This PR adds an optional Stripe payment gateway, full dark and light theme (plus a theme toggle button), better dashboard with time filters and a spending chart, transaction notes and pagination, quick pay with prefilled recipient, and proper light theme styling. It also fixes a bug on the Send Payment page and makes the spending chart easier to read.

---

## 1. Stripe integration (optional payment gateway)

- **Real card payments** – When Stripe secret and publishable keys are set in the environment, the Send payment form uses Stripe’s card field and creates a payment through Stripe. Without these keys, the app runs in demo mode and no real money is charged.
- **Webhook** – When Stripe confirms a successful payment, the app receives a webhook, updates the transaction and notifies the user. You need to run the Stripe CLI to forward webhooks to your app and set the webhook secret in the environment.
- **Refunds** – Completed Stripe payments can be refunded. The Refund button appears in the transaction detail popup when Stripe is enabled.
- **Payment links** – Users can create shareable payment links from the Payment links page. Anyone with the link can open a public checkout page (no login required). When they pay, the webhook marks the linked transaction as completed.
- **Demo vs Stripe** – The app checks whether Stripe is configured and shows either the real Stripe form or the demo form.

---

## 2. Theme (dark, light, system) and dark mode button

- **How themes work** – The app applies the chosen theme by updating the page’s appearance and saving the preference in the browser. “System” follows the device’s light or dark setting.
- **Settings page** – On Settings, users can pick Dark, Light, or System from a dropdown. Saving updates their preference and the theme changes right away.
- **Dark mode button** – A new button in the sidebar (next to the PayFlow logo) lets users switch between dark and light with one click. In dark mode the button shows a sun icon (click to go light); in light mode it shows a moon icon (click to go dark). It stays in sync with the theme chosen in Settings.
- **Light theme styling** – The light theme is fully styled so the dashboard, sidebar, cards, form fields, focus states, and scrollbars all look correct in light mode.

---

## 3. Dashboard improvements

- **Time period filter** – Tabs above the stats let users choose “Last 7 days”, “Last 30 days”, or “All time”. The summary numbers and recent transactions list both respect the selected period.
- **Quick pay** – A section shows up to three recent recipients. Each one is a link that opens the Send payment page with that recipient already filled in.
- **Spending overview chart** – A card shows a bar chart of completed payments for the last six months. The chart is always visible, with clear bars and month labels, and is accessible for screen readers.

---

## 4. Transactions and transaction detail

- **Transaction notes** – Users can add or edit a note on any transaction in the detail popup. The note is saved automatically when they leave the field (on blur). The backend stores the note and returns it when loading the transaction.
- **Pagination** – The transactions table shows 10 rows per page with Previous and Next buttons. The count shows how many transactions match the filters and which page you’re on. Changing filters jumps back to page one. Export CSV still exports all filtered transactions, not just the current page.
- **Detail popup** – From the popup users can print a receipt, refund (when Stripe is on), and edit the transaction note.

---

## 5. Send payment and recipient prefill

- **Recipient prefill** – The Send payment page can be opened with a recipient already set. For example, Quick pay links open the page with the recipient field filled in. The same works when the page is opened with a recipient in the URL (e.g. from a bookmark or shared link).
- **Bug fix** – Fixed the “Rendered fewer hooks than expected” error on the Send Payment page by ensuring all React hooks run in the same order every time, even when switching between the Stripe and demo forms.

---

## 6. Auth, profile and sign-in activity

- **Auth** – The app uses NextAuth with email and password (Credentials) and JWT. Users can register and log in. The dashboard is protected so only signed-in users can access it. The sidebar shows who is signed in.
- **Sign-in activity** – The Profile page lists recent sign-ins. The app records each successful login and loads this list from the backend so users can see their sign-in history.

---

## 7. Other features

- **Recipients** – Users can add, edit and delete recipients and choose them when sending a payment.
- **Request payment** – Users can create and manage payment requests.
- **Notifications** – The notification center and backend support in-app notifications.
- **Payment links** – Users can create and manage payment links; the public checkout page is available to anyone with the link.
- **Settings** – Users can set currency, notification preferences and theme.
- **Help** – FAQ page for common questions.
- **404** – Custom “not found” page when a URL doesn’t exist.
- **Breadcrumbs** – Navigation breadcrumbs on the dashboard and other pages.

---

## 8. UI polish

- **Spending chart** – The chart card is always shown, with solid bars, consistent height and spacing, month labels and tooltips on hover.
- **Light theme** – Sidebar, cards, inputs, scrollbars and shadows are all styled for light mode so the app looks consistent.
- **Small fix** – Fixed a missing comma in the Recent transactions card header that could cause a syntax issue.

---

## Environment variables

- **NextAuth** – Set the app URL and a secret (e.g. generate one with `openssl rand -base64 32`).
- **Stripe (optional)** – For real payments, set the Stripe secret key, publishable key and webhook secret. See the example env file and Stripe’s docs for setting up webhooks locally.

---

## Testing suggestions

- Toggle theme using the sidebar button and from Settings; check that dark, light and system all work.
- With and without Stripe keys: try sending a payment (demo vs real), refunding from the transaction popup, and creating and using payment links.
- On the dashboard: change the time period, use Quick pay links, and check the spending chart and recent transactions.
- On Transactions: use pagination and filters, export CSV, open a transaction, edit and save a note, print a receipt, and refund when Stripe is on.
- Open the Send payment page with a recipient in the URL and confirm the recipient field is prefilled.
