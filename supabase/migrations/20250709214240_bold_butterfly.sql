/*
  # Create watchlist table for user asset tracking

  1. New Table
    - `watchlist` - Store user watchlist items
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symbol` (text) - Asset symbol
      - `market_type` (text) - 'crypto' or 'stock'
      - `is_favorite` (boolean) - Whether the asset is favorited
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access

  3. Indexes
    - Add indexes for better query performance
*/

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  market_type text NOT NULL CHECK (market_type IN ('crypto', 'stock')),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol, market_type)
);

-- Enable RLS on watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for watchlist
CREATE POLICY "Users can manage their own watchlist"
  ON watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist USING btree (symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_market_type ON watchlist USING btree (market_type);