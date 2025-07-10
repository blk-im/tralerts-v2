/*
  # Create portfolio table for user asset tracking

  1. New Table
    - `portfolio` - Store user portfolio items
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symbol` (text) - Asset symbol
      - `market_type` (text) - 'crypto' or 'stock'
      - `quantity` (numeric) - Amount of the asset
      - `average_price` (numeric) - Average purchase price
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access

  3. Indexes
    - Add indexes for better query performance
*/

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  market_type text NOT NULL CHECK (market_type IN ('crypto', 'stock')),
  quantity numeric(20,8) NOT NULL DEFAULT 0,
  average_price numeric(20,8) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol, market_type)
);

-- Enable RLS on portfolio
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for portfolio
CREATE POLICY "Users can manage their own portfolio"
  ON portfolio
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio USING btree (symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_market_type ON portfolio USING btree (market_type);