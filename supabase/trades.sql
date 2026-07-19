-- ============================================================
-- Trades tracker: a new page type + its own isolated tables.
-- Run this whole script in the Supabase SQL editor. Safe to re-run.
-- ============================================================

-- 1. A page can now be a normal doc ('doc') or a trades tracker ('trades').
ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'doc';

-- 2. Brokers (accounts). Each is a stock or futures broker; no starting balance.
CREATE TABLE IF NOT EXISTS public.trade_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES public.custom_pages(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'IDR',
  broker_type TEXT NOT NULL DEFAULT 'stock',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If trade_accounts already existed from the earlier version, add the broker type.
ALTER TABLE public.trade_accounts
  ADD COLUMN IF NOT EXISTS broker_type TEXT NOT NULL DEFAULT 'stock';

-- 3. Stock purchase lots. Each buy is a row; the portfolio merges lots by stock code
--    (weighted-average price). Total buy = buy_price * volume (computed in the app).
CREATE TABLE IF NOT EXISTS public.trade_stock_lots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id    UUID NOT NULL REFERENCES public.custom_pages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.trade_accounts(id) ON DELETE CASCADE,
  stock_code TEXT NOT NULL,
  buy_date   DATE NOT NULL,
  buy_price  NUMERIC NOT NULL DEFAULT 0,
  volume     NUMERIC NOT NULL DEFAULT 0,
  fee        NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Stock sells (partial sells allowed). Realized P/L is computed in the app
--    against the weighted-average buy price.
CREATE TABLE IF NOT EXISTS public.trade_stock_sells (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id    UUID NOT NULL REFERENCES public.custom_pages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.trade_accounts(id) ON DELETE CASCADE,
  stock_code TEXT NOT NULL,
  sell_date  DATE NOT NULL,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  volume     NUMERIC NOT NULL DEFAULT 0,
  fee        NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes.
CREATE INDEX IF NOT EXISTS trade_accounts_page_idx        ON public.trade_accounts(page_id);
CREATE INDEX IF NOT EXISTS trade_stock_lots_page_idx      ON public.trade_stock_lots(page_id);
CREATE INDEX IF NOT EXISTS trade_stock_lots_account_idx   ON public.trade_stock_lots(account_id);
CREATE INDEX IF NOT EXISTS trade_stock_sells_page_idx     ON public.trade_stock_sells(page_id);
CREATE INDEX IF NOT EXISTS trade_stock_sells_account_idx  ON public.trade_stock_sells(account_id);

-- 6. Row Level Security.
ALTER TABLE public.trade_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_stock_lots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_stock_sells  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own trade_accounts" ON public.trade_accounts;
CREATE POLICY "own trade_accounts" ON public.trade_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own trade_stock_lots" ON public.trade_stock_lots;
CREATE POLICY "own trade_stock_lots" ON public.trade_stock_lots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own trade_stock_sells" ON public.trade_stock_sells;
CREATE POLICY "own trade_stock_sells" ON public.trade_stock_sells
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Grants (this project requires explicit grants to authenticated).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_accounts     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_stock_lots   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_stock_sells  TO authenticated;

-- ------------------------------------------------------------
-- Optional cleanup: the first version created these two tables,
-- which the broker/portfolio model no longer uses. Uncomment to drop.
-- DROP TABLE IF EXISTS public.trade_transactions;
-- DROP TABLE IF EXISTS public.trade_account_types;
-- ------------------------------------------------------------
