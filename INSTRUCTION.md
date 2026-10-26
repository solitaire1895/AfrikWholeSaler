# AfrikWholesaler — Setup Instructions

## External Actions Required

The following steps must be completed manually before the backend will function. These cannot be automated from the codebase.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and fill in the details:
   - **Name**: `afrik-wholesaler` (or your preferred name)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select the closest region to your users (e.g., `Frankfurt` for African/European traffic).
3. Wait for the project to provision (~2 minutes).

---

## 2. Run the Database Schema

1. In your Supabase Dashboard, go to **SQL Editor** → **New Query**.
2. Open the file `supabase/schema.sql` from this project.
3. Copy the **entire contents** and paste it into the SQL Editor.
4. Click **Run**. You should see "Success" with no errors.
5. Verify tables were created: go to **Table Editor** — you should see 12 tables (`profiles`, `categories`, `products`, `customers`, `orders`, `order_items`, `quote_requests`, `shipments`, `conversations`, `messages`, `staff`).

---

## 3. Storage Buckets

The `schema.sql` script (Step 2) automatically creates these buckets with RLS policies:

| Bucket Name | Public? | Purpose | Auto-created? |
|---|---|---|---|
| `product-images` | ✅ Public | Product photos | ✅ Yes (by schema.sql) |
| `product-videos` | ✅ Public | Product videos | ✅ Yes (by schema.sql) |
| `chat-attachments` | 🔒 Private | Chat file uploads | ✅ Yes (by schema.sql) |
| `customer-docs` | 🔒 Private | KYC / customs documents | ❌ Create manually |
| `quote-attachments` | 🔒 Private | Quote request attachments | ❌ Create manually |

Only create the two **private** buckets manually in the Supabase Dashboard (**Storage** → **New Bucket**):
- `customer-docs` (private)
- `quote-attachments` (private)

---

## 4. Configure Environment Variables

1. In Supabase Dashboard, go to **Settings** → **API**.
2. Copy your **Project URL** and **anon public key**.
3. Create a file called `.env.local` in the project root (same level as `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. (Optional) If you need server-side admin operations that bypass RLS, also add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   ⚠️ **Never expose the service role key to the client.** It is only for server-side use.

---

## 5. Enable Email Auth (if not already enabled)

1. In Supabase Dashboard, go to **Authentication** → **Providers**.
2. Ensure **Email** is enabled.
3. (Optional) Disable "Confirm email" for development, or configure an email provider for production.

---

## 6. Create an Admin User

After deploying, you need at least one admin user to access the `/admin` panel:

1. Go to **Authentication** → **Users** → **Add user**.
2. Enter an email and password.
3. After the user is created, go to **Table Editor** → `profiles` and find the row for that user.
4. Change the `role` column from `customer` to `admin` (or `super_admin`).

---

## 7. Run Additional SQL Scripts

Run these in the Supabase SQL Editor after `schema.sql`:

### 7a. Countries Table (Recommended)
1. Open `supabase/countries.sql` and run it.
2. This creates a `countries` lookup table with ~100 countries across Africa, Europe, North America, South America, Asia, Middle East, and Oceania.

### 7b. Seed Catalog Data (Recommended)
1. Open `supabase/seed.sql` and run it.
2. This inserts 8 categories, 17 sub-categories, and 8 products with full pricing tiers, specs, and images.

### 7c. Demo Users (Optional — for testing)
1. Open `supabase/seed_users.sql` and run it.
2. This creates 11 demo users (8 customers + 3 staff) with auth accounts.
3. **Password for all demo users:** `DemoPassword123!`
4. Demo accounts:
   - `admin@demo.com` — Super Admin
   - `sales.rep@demo.com` — Sales Representative
   - `support.agent@demo.com` — Customer Support Agent
   - `amadou.diallo@demo.com` — Verified customer (Senegal)
   - `fatima.okonkwo@demo.com` — Verified customer (Nigeria)
   - `thomas.mueller@demo.com` — Customer (Germany)
   - `carlos.silva@demo.com` — Customer (Brazil)
   - `sarah.johnson@demo.com` — Customer (United States)

### 7d. Purchase Requests Table (Required for PR module)
1. Open `supabase/purchase_requests.sql` and run it.
2. This creates the `purchase_requests` table for internal procurement tracking.

---

## 8. Seed Initial Data (See Step 7)

For the app to display products and categories, you need to seed the database. You can either:

### Option A: Use the Supabase SQL Editor
Write `INSERT` statements for the `categories` and `products` tables based on the mock data in `src/lib/data.ts`.

### Option B: Use the Admin Panel
Once you have an admin user (Step 6), log in and use the admin product management UI to add products and categories manually.

---

## 8. Enable Real-time (Required for Live Chat)

The live chat system uses Supabase Realtime (WebSocket-based) to push new messages instantly to both customers and staff. Without this step, messages will only appear on page refresh — not in real-time.

1. In Supabase Dashboard, go to **Database** → **Replication**.
2. Under **Supabase Realtime**, enable replication for these tables:
   - `messages` — **Required** for live chat
   - `conversations` — **Required** for live chat (new conversation notifications)
   - `orders` — Recommended (real-time order status updates)
   - `shipments` — Recommended (real-time shipment tracking)
   - `quote_requests` — Recommended (real-time quote status updates)

> ⚠️ **At minimum, enable `messages` and `conversations`** — the live chat will not work in real-time without them.

---

## 9. Install Dependencies & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 10. Get a Resend API Key (transactional emails)

Resend sends the order confirmations, payment receipts, shipping updates and invoices. Free plan: 3,000 emails/month (100/day).

### a. Create the account and the key
1. Go to [resend.com](https://resend.com) and click **Sign up** (you can use your Google or GitHub account).
2. In the dashboard, open **API Keys** → **Create API Key**.
   - **Name**: `afrikwholesaler-production`
   - **Permission**: **Sending access**
   - **Domain**: choose your domain once it's added (step b), or **All domains** for now.
3. Click **Add**, then copy the key. It starts with `re_` and **is shown only once**.

### b. Verify your domain (so emails come from you and don't land in spam)
1. In Resend, open **Domains** → **Add Domain** and enter your domain, e.g. `afrikwholesaler.com`.
   Tip: use a subdomain like `mail.afrikwholesaler.com` so it doesn't interfere with your normal mailbox.
2. Resend shows a few DNS records (one **MX**, one or two **TXT** for SPF and DKIM, and optionally **DMARC**).
3. Add them at your domain host. On **Hostinger**: **hPanel** → **Domains** → your domain → **DNS / Nameservers** → **Manage DNS records**, then add each record exactly as Resend shows it (type, name, value). Delete nothing that already exists.
4. Back in Resend, click **Verify DNS Records**. It can take from a few minutes up to 24 hours. The status must be **Verified**.

### c. Add it to the project
In `.env.local` (and later in your Hostinger environment variables), add:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="AfrikWholesaler <orders@afrikwholesaler.com>"
```
The address in `EMAIL_FROM` must use the domain you verified. While the domain isn't verified yet, Resend only lets you send test emails **to your own Resend account address**, from `onboarding@resend.dev`.

⚠️ Never put the key in the code or share it in chat. If it ever leaks, delete it in **API Keys** and create a new one.

---

### d. Emails the app sends

| Email | When | Language |
|---|---|---|
| Order confirmation | Right after checkout | The language the customer shops in |
| Payment receipt | When SasPay confirms the payment (sent once) | Customer's saved language |
| Shipping update | When staff create the shipment, or post a tracking update marked "visible to the customer" | Customer's saved language |

Run `supabase/emails.sql` once (it adds the `locale` column used to remember each customer's language). Without it, emails are sent in French.

### e. Send Supabase's own emails through Resend (signup confirmation, password reset)

Supabase's built-in mail server is limited to a few emails per hour and often lands in spam. Route it through Resend:

1. Supabase Dashboard → **Project Settings** → **Authentication** → **SMTP Settings** → enable **Custom SMTP**.
2. Fill in:
   | Field | Value |
   |---|---|
   | Sender email | `orders@mail.afrikwholesaler.store` (same domain as `EMAIL_FROM`) |
   | Sender name | `AfrikWholesaler` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key (`re_…`) |
3. **Save**. Then **Authentication** → **Rate Limits**: raise "emails sent per hour" (e.g. 100).
4. Optional: **Authentication** → **Email Templates** to translate the confirmation and reset emails (French by default for your customers).

---

## 11. Get a Sentry DSN (error monitoring)

Sentry emails you when something breaks (failed payment, webhook error, page crash) with the details needed to fix it. Free plan: 5,000 errors/month, 1 user.

### a. Create the account and the project
1. Go to [sentry.io/signup](https://sentry.io/signup/) and create an account. Pick the data region closest to you (**EU** is a good choice for Africa/Europe).
2. Create an **organization** when asked (e.g. `afrikwholesaler`).
3. Click **Projects** → **Create Project**:
   - **Platform**: **Next.js**
   - **Alert frequency**: "Alert me on every new issue"
   - **Project name**: `afrikwholesaler-web`
4. Click **Create Project**. Sentry shows a setup page — **you can skip the wizard** (it's already handled in the code). Just copy the **DSN**.

### b. Where to find the DSN later
**Settings** → **Projects** → `afrikwholesaler-web` → in the left menu, group **SDK Setup** → **Client Keys (DSN)** (sometimes just **Keys**).
Direct link: `https://<your-org>.sentry.io/settings/projects/afrikwholesaler-web/keys/`.
⚠️ Don't confuse it with **Security Token** (a different setting, not needed). The DSN is a URL containing `ingest`, like:
```
https://abc123def456@o123456.ingest.de.sentry.io/7890123
```

### c. (Optional) Auth token for readable error traces
So production errors point to your real source lines instead of minified code:
1. **Settings** → **Auth Tokens** → **Create New Token** (organization token, default scopes).
2. Copy it (shown only once).

### d. Add it to the project
In `.env.local` (and later in your Hostinger environment variables), add:
```
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.de.sentry.io/7890123
SENTRY_ORG=afrikwholesaler
SENTRY_PROJECT=afrikwholesaler-web
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxx   # optional, from step c
```
The DSN is safe to be public (it only lets the app *send* errors). The **auth token is secret** — keep it in the environment only.

### e. Check it works
After the integration is deployed, Sentry's project page shows **"Waiting for events"** until the first error arrives. You'll receive an email for each new error.

---

## Architecture Summary

| File | Purpose |
|---|---|
| `supabase/schema.sql` | Database schema, RLS policies, triggers |
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/server.ts` | Server-side Supabase client (cookies) |
| `src/lib/queries.ts` | Server-side read queries (DB row → frontend type mappers) |
| `src/app/actions/auth.ts` | Auth server action (logout) |
| `src/app/actions/crud.ts` | All CRUD server actions with role-based auth checks |
| `src/lib/realtime.ts` | Client-side real-time subscription helpers |
| `src/proxy.ts` | Middleware: session refresh + route protection + role-based access |
| `src/lib/data.ts` | Mock data (still used by public pages — to be migrated) |
| `src/types/index.ts` | TypeScript domain types |

---

## Migration Status

| Layer | Status |
|---|---|
| Database schema + RLS | ✅ Complete |
| Supabase client setup | ✅ Complete |
| Auth (login/register/logout) | ✅ Complete |
| Server-side query layer | ✅ Complete (`src/lib/queries.ts`) |
| CRUD server actions | ✅ Complete (`src/app/actions/crud.ts`) |
| Role-based middleware | ✅ Complete (`src/proxy.ts`) |
| File upload | ✅ Complete (`uploadFile` action) |
| Real-time subscriptions | ✅ Complete (`src/lib/realtime.ts`) |
| Dashboard pages → real data | ⏳ Pending (pages still import from `data.ts`) |
| Admin pages → real data | ⏳ Pending (pages still import from `data.ts`) |
| Public pages → real data | ⏳ Pending (pages still import from `data.ts`) |

### Next Step: Wire Pages to Real Data

To connect the dashboard/admin pages to real Supabase data, each page needs to:
1. Become an `async` Server Component (remove `"use client"` if present).
2. Import from `@/lib/queries` instead of `@/lib/data`.
3. Call the appropriate query function (e.g., `getOrdersByCustomer(customerId)`).
4. Pass the data to the existing render logic.

Example for `src/app/dashboard/page.tsx`:
```tsx
// Before (mock):
import { orders, shipments, currentCustomer } from "@/lib/data";

// After (real):
import { getOrdersByCustomer, getShipmentsByCustomer, getCurrentCustomer } from "@/lib/queries";

export default async function DashboardPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");
  const orders = await getOrdersByCustomer(customer.id);
  const shipments = await getShipmentsByCustomer(customer.id);
  // ... rest of render logic stays the same
}