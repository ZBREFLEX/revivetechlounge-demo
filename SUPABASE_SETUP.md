# Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and publishable key from **Project Settings > API Keys**.
5. Start the app with `npm run dev`.

Supabase Auth stores login information in the project's PostgreSQL database. The
SQL script adds a `public.profiles` table for application-specific user data,
enables Row Level Security, and requires super-admin approval before a user can
enter the dashboard.

## Create the first super admin

1. Run the latest full `supabase/schema.sql` script in the Supabase SQL Editor.
   This updates older `profiles` tables and creates missing profile rows for
   users who registered before the approval workflow was installed.
2. Register your own account from the app.
3. Confirm the email if confirmation is enabled in Supabase.
4. In the Supabase SQL Editor, run this once with your email:

```sql
update public.profiles
set role = 'super-admin', approved = true
where email = 'YOUR_EMAIL_ADDRESS';
```

5. Sign in again and open **User Access** in the dashboard sidebar.

New registrations always receive the `staff` role and remain blocked until a
super admin approves them. After bootstrapping the first super admin, use the
dashboard **User Access** page to approve users, block access, assign shops, and change
roles.

If the **User Access** page shows only the current super admin, run the latest
full `supabase/schema.sql` script again. It installs the guarded
`list_user_access()` function used by the approval table and refreshes the
Supabase Data API schema cache.

## Set up shops

Run `supabase/setup-shops.sql` in the Supabase SQL Editor once. It creates the
shops table, adds the two starter shops, and installs the secured functions used
by the **Shops** dashboard page.

For local testing, either confirm the signup email or temporarily disable
**Authentication > Providers > Email > Confirm email** in the Supabase dashboard.
