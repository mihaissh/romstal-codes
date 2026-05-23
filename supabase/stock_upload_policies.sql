-- RULAZĂ ACESTE COMANDE ÎN SUPABASE SQL EDITOR PENTRU A PERMITE ACTUALIZAREA STOCULUI:
-- Această configurare permite utilizatorilor autentificați să insereze și să actualizeze produse în tabelul "products".

-- 1. Permite inserarea de noi rânduri de către utilizatorii autentificați
CREATE POLICY "products_stock_insert_authenticated"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Permite actualizarea rândurilor existente de către utilizatorii autentificați
CREATE POLICY "products_stock_update_authenticated"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

