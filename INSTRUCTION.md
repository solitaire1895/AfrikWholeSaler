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

## 3. Create Storage Buckets

In the Supabase Dashboard, go to **Storage** → **New Bucket** and create these 4 buckets:

| Bucket Name | Public? | Purpose |
|---|---|---|
| `product-images` | ✅ Public | Product photos |
| `customer-docs` | 🔒 Private | KYC / customs documents |
| `chat-attachments` | 🔒 Private | Chat file uploads |
| `quote-attachments` | 🔒 Private | Quote request attachments |

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

## 7. Seed Initial Data (Optional but Recommended)

For the app to display products and categories, you need to seed the database. You can either:

### Option A: Use the Supabase SQL Editor
Write `INSERT` statements for the `categories` and `products` tables based on the mock data in `src/lib/data.ts`.

### Option B: Use the Admin Panel
Once you have an admin user (Step 6), log in and use the admin product management UI to add products and categories manually.

---

## 8. Enable Real-time (Optional)

To use the real-time chat and order tracking features:

1. In Supabase Dashboard, go to **Database** → **Replication**.
2. Under **Supabase Realtime**, enable replication for these tables:
   - `messages`
   - `orders`
   - `shipments`
   - `quote_requests`
   - `conversations`

---

## 9. Install Dependencies & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

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