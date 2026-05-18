-- Run in Supabase SQL editor if uploads fail with permission errors.
-- Adjust auth rules to match how you secure the app (e.g. authenticated staff only).

-- Example: allow authenticated users to update products for stock upload
-- create policy "products_stock_update_authenticated"
--   on public.products for update
--   to authenticated
--   using (true)
--   with check (true);

-- create policy "products_stock_insert_authenticated"
--   on public.products for insert
--   to authenticated
--   with check (true);
