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

## Set up products

After setting up shops, run `supabase/setup-products.sql` in the Supabase SQL
Editor once. It creates the product catalog, starter categories and brands, and
the secured functions used by the **Products** dashboard pages. It also creates
the `product-images` Storage bucket so product editors can either paste an image
URL or upload a local image file up to 5 MB.

If local image uploads fail because the Storage bucket is missing, run
`supabase/setup-product-images.sql` after `supabase/setup-products.sql`.

## Set up inventory

After setting up products, run `supabase/setup-inventory.sql` in the Supabase SQL
Editor once. It installs the live stock list, secured stock adjustments, and an
inventory movement history table used by the **Inventory** dashboard page.

## Set up categories

After setting up products, run `supabase/setup-categories.sql` in the Supabase
SQL Editor once. It installs the secured functions used by the **Categories**
dashboard page. Categories that are still used by products cannot be deleted.

## Set up brands

After setting up products, run `supabase/setup-brands.sql` in the Supabase SQL
Editor once. It installs the secured functions used by the **Brands** dashboard
page. Brands that are still assigned to products cannot be deleted.

## Set up dashboard

After setting up products, inventory, and settings, run
`supabase/setup-dashboard.sql` in the Supabase SQL Editor once. It installs the
live summary used by the main **Dashboard** page, including inventory alerts and
recent stock activity.

## Set up settings

Run `supabase/setup-settings.sql` in the Supabase SQL Editor once. It creates the
shared store settings used by the **Settings** page. Only a super admin can
change shared store details, currency, and the low-stock threshold. Run the
latest `supabase/setup-dashboard.sql` again afterward so the dashboard uses the
saved threshold.

To update an existing installation to the REVIVETECHLOUNGE name, run
`supabase/update-branding.sql` once.

## Set up stock manager role

Run `supabase/setup-stock-manager-role.sql` once to replace the old `manager`
role with `stock-manager`. Stock managers can add, edit, and delete products and
adjust stock. Approved staff can only use **Sold Out** on the Products page,
which asks for the customer's name, phone, and an optional note before removing
one unit and recording the sale in inventory history.

For an existing installation, run `supabase/setup-shop-scoped-stock-managers.sql`
afterward. Stock managers can view products and inventory across all shops, but
can only add, edit, delete, or adjust stock for their assigned shop. Approved
staff can also view products and inventory across shops, but can only mark items
as sold for their assigned shop. Admins and super admins continue to manage
every shop.

## Set up sales reporting

After setting up the stock manager role, run `supabase/setup-sales-reporting.sql`
once. It adds the seven-day sales line graph to the Dashboard and the protected
**Customers** page for approved staff, admins, and stock managers.

## Set up user deletion and staff customer access

Run `supabase/setup-user-delete-and-staff-customers.sql` once. It adds the
super-admin **Delete** action on the **User Access** page and allows approved
staff to open the **Customers** page. Deleted staff accounts are removed while
their older sales records remain available.

For local testing, either confirm the signup email or temporarily disable
**Authentication > Providers > Email > Confirm email** in the Supabase dashboard.
