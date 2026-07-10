-- Alter monthly_bills table to support advance payments, previous dues, adjustments, laundry, maintenance, and security deposits
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS laundry NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS maintenance NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS previous_due NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS adjustment NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Recreate generated total_amount column with the updated formula
ALTER TABLE public.monthly_bills DROP COLUMN IF EXISTS total_amount;
ALTER TABLE public.monthly_bills ADD COLUMN total_amount NUMERIC(10,2)
  GENERATED ALWAYS AS (base_rent + electricity + water + internet + food + cleaning + laundry + maintenance + security_deposit + previous_due + other_charges + late_fee + adjustment - discount) STORED;
